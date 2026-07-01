import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

// GET ?event_id=X&member_id=Y  — check if member is registered for event
// GET ?event_id=X               — all registrations for an event
// GET ?member_id=X              — all events a member is registered for
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get("event_id");
    const member_id = searchParams.get("member_id");

    if (event_id && member_id) {
      const rows = await sql`
        SELECT * FROM event_registrations
        WHERE event_id = ${event_id} AND member_id = ${member_id}
      `;
      return NextResponse.json(rows);
    }

    if (event_id) {
      const rows = await sql`
        SELECT er.*, m.name, m.email
        FROM event_registrations er
        JOIN members m ON m.id = er.member_id
        WHERE er.event_id = ${event_id}
        ORDER BY er.registered_at ASC
      `;
      return NextResponse.json(rows);
    }

    if (member_id) {
      const rows = await sql`
        SELECT er.*, e.name AS event_name, e.date_time, e.location
        FROM event_registrations er
        JOIN events e ON e.id = er.event_id
        WHERE er.member_id = ${member_id}
        ORDER BY e.date_time DESC
      `;
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: "event_id or member_id is required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

// PATCH — update payment_confirmed for a specific registration
export async function PATCH(request) {
  try {
    const { event_id, member_id, payment_confirmed } = await request.json();
    if (!event_id || !member_id) {
      return NextResponse.json({ error: "event_id and member_id are required" }, { status: 400 });
    }
    const result = await sql`
      UPDATE event_registrations
      SET payment_confirmed = ${payment_confirmed}
      WHERE event_id = ${event_id} AND member_id = ${member_id}
      RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}

// DELETE ?event_id=X&member_id=Y — remove a specific registration (admin only)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    const member_id = searchParams.get('member_id');
    if (!event_id || !member_id) {
      return NextResponse.json({ error: 'event_id and member_id are required' }, { status: 400 });
    }
    const result = await sql`
      DELETE FROM event_registrations
      WHERE event_id = ${event_id} AND member_id = ${member_id}
      RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    await sql`
      UPDATE events SET registered_count = GREATEST(COALESCE(registered_count, 0) - 1, 0) WHERE id = ${event_id}
    `;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}

// POST — register a member for an event, increment registered_count
export async function POST(request) {
  try {
    const { event_id, member_id } = await request.json();
    if (!event_id || !member_id) {
      return NextResponse.json({ error: "event_id and member_id are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO event_registrations (event_id, member_id)
      VALUES (${event_id}, ${member_id})
      RETURNING *
    `;

    await sql`
      UPDATE events SET registered_count = COALESCE(registered_count, 0) + 1 WHERE id = ${event_id}
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating registration:", error);
    if (error.message?.includes('unique') || error.code === '23505') {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to save registration" }, { status: 500 });
  }
}
