import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

// GET ?event_id=X&member_id=Y  — check if member is registered for event
// GET ?event_id=X               — all registrations for an event (members + guests)
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
      // LEFT JOIN so guest registrations (no member_id) still show up
      const rows = await sql`
        SELECT er.*,
               COALESCE(m.name, er.guest_name) AS name,
               COALESCE(m.email, er.guest_email) AS email,
               (er.member_id IS NULL) AS is_guest
        FROM event_registrations er
        LEFT JOIN members m ON m.id = er.member_id
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

// PATCH — update payment_confirmed and/or rsvp_status for a registration.
// Identify the row either by {event_id, member_id} (existing members) or
// {id} (works for both members and guests).
// When rsvp_status changes between 'going' and 'maybe', registered_count is adjusted.
export async function PATCH(request) {
  try {
    const { id, event_id, member_id, payment_confirmed, rsvp_status } = await request.json();

    if (rsvp_status && !['going', 'maybe'].includes(rsvp_status)) {
      return NextResponse.json({ error: "rsvp_status must be 'going' or 'maybe'" }, { status: 400 });
    }

    // Fetch current row first so we can detect status transitions
    let current;
    if (id) {
      const rows = await sql`SELECT * FROM event_registrations WHERE id = ${id}`;
      current = rows[0];
    } else if (event_id && member_id) {
      const rows = await sql`SELECT * FROM event_registrations WHERE event_id = ${event_id} AND member_id = ${member_id}`;
      current = rows[0];
    } else {
      return NextResponse.json({ error: "id, or event_id and member_id, are required" }, { status: 400 });
    }

    if (!current) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

    // Handle capacity slot changes on status transition
    if (rsvp_status && rsvp_status !== current.rsvp_status) {
      if (rsvp_status === 'going') {
        // maybe → going: atomically claim a slot
        const slotClaim = await sql`
          UPDATE events
          SET registered_count = COALESCE(registered_count, 0) + 1
          WHERE id = ${current.event_id}
            AND (capacity IS NULL OR COALESCE(registered_count, 0) < capacity)
          RETURNING registered_count
        `;
        if (slotClaim.length === 0) {
          return NextResponse.json({ error: "This event is full." }, { status: 409 });
        }
      } else if (rsvp_status === 'maybe') {
        // going → maybe: release the slot
        await sql`
          UPDATE events
          SET registered_count = GREATEST(COALESCE(registered_count, 0) - 1, 0)
          WHERE id = ${current.event_id}
        `;
      }
    }

    let result;
    if (id) {
      result = await sql`
        UPDATE event_registrations
        SET payment_confirmed = COALESCE(${payment_confirmed}, payment_confirmed),
            rsvp_status = COALESCE(${rsvp_status}, rsvp_status)
        WHERE id = ${id}
        RETURNING *
      `;
    } else {
      result = await sql`
        UPDATE event_registrations
        SET payment_confirmed = COALESCE(${payment_confirmed}, payment_confirmed),
            rsvp_status = COALESCE(${rsvp_status}, rsvp_status)
        WHERE event_id = ${event_id} AND member_id = ${member_id}
        RETURNING *
      `;
    }

    if (result.length === 0) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}

// DELETE ?id=X                    — remove a specific registration by its own id (works for guests too)
// DELETE ?event_id=X&member_id=Y  — remove a specific member's registration (legacy)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const event_id = searchParams.get('event_id');
    const member_id = searchParams.get('member_id');

    let result;
    if (id) {
      result = await sql`DELETE FROM event_registrations WHERE id = ${id} RETURNING *`;
    } else if (event_id && member_id) {
      result = await sql`
        DELETE FROM event_registrations
        WHERE event_id = ${event_id} AND member_id = ${member_id}
        RETURNING *
      `;
    } else {
      return NextResponse.json({ error: 'id, or event_id and member_id, are required' }, { status: 400 });
    }

    if (result.length === 0) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    if (result[0].rsvp_status === 'going') {
      await sql`
        UPDATE events SET registered_count = GREATEST(COALESCE(registered_count, 0) - 1, 0) WHERE id = ${result[0].event_id}
      `;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
  }
}

// POST — register for an event.
// Either provide member_id (existing member), or guest_name (+ optional
// guest_email) for someone registered outside the site (e.g. via
// PlayByPoint directly). Optional rsvp_status: 'going' (default) or 'maybe'.
// Only 'going' consumes a capacity slot.
export async function POST(request) {
  try {
    const { event_id, member_id, guest_name, guest_email, rsvp_status = 'going' } = await request.json();

    if (!event_id) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }
    if (!member_id && !guest_name) {
      return NextResponse.json({ error: "member_id or guest_name is required" }, { status: 400 });
    }
    if (!['going', 'maybe'].includes(rsvp_status)) {
      return NextResponse.json({ error: "rsvp_status must be 'going' or 'maybe'" }, { status: 400 });
    }

    // Atomically claim a capacity slot for 'going' registrations
    if (rsvp_status === 'going') {
      const slotClaim = await sql`
        UPDATE events
        SET registered_count = COALESCE(registered_count, 0) + 1
        WHERE id = ${event_id}
          AND (capacity IS NULL OR COALESCE(registered_count, 0) < capacity)
        RETURNING registered_count
      `;
      if (slotClaim.length === 0) {
        return NextResponse.json({ error: "This event is full." }, { status: 409 });
      }
    }

    try {
      const result = await sql`
        INSERT INTO event_registrations (event_id, member_id, guest_name, guest_email, rsvp_status)
        VALUES (${event_id}, ${member_id || null}, ${guest_name || null}, ${guest_email || null}, ${rsvp_status})
        RETURNING *
      `;
      return NextResponse.json(result[0], { status: 201 });
    } catch (insertError) {
      // Roll back the slot claim if the insert fails due to duplicate
      if (rsvp_status === 'going' && (insertError.message?.includes('unique') || insertError.code === '23505')) {
        await sql`
          UPDATE events
          SET registered_count = GREATEST(COALESCE(registered_count, 0) - 1, 0)
          WHERE id = ${event_id}
        `;
        return NextResponse.json({ error: "You're already registered for this event." }, { status: 409 });
      }
      throw insertError;
    }
  } catch (error) {
    console.error("Error creating registration:", error);
    if (error.message?.includes('unique') || error.code === '23505') {
      return NextResponse.json({ error: "You're already registered for this event." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to save registration" }, { status: 500 });
  }
}
