import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/event-checkins?event_id=X  — all members + check-in status for an event
// GET /api/event-checkins?member_id=X — all check-in records for a member
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get("event_id");
    const member_id = searchParams.get("member_id");

    if (member_id) {
      const rows = await sql`
        SELECT * FROM event_checkins WHERE member_id = ${member_id}
      `;
      return NextResponse.json(rows);
    }

    if (!event_id) return NextResponse.json({ error: "event_id or member_id is required" }, { status: 400 });

    const rows = await sql`
      SELECT
        m.id AS member_id,
        m.name,
        m.email,
        COALESCE(c.checked_in, false) AS checked_in,
        c.checked_in_at
      FROM members m
      LEFT JOIN event_checkins c ON c.member_id = m.id AND c.event_id = ${event_id}
      WHERE m.approved = true
      ORDER BY m.name ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching checkins:", error);
    return NextResponse.json({ error: "Failed to fetch checkins" }, { status: 500 });
  }
}

// POST /api/event-checkins — upsert a check-in record
export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { event_id, member_id, checked_in } = await request.json();
    if (!event_id || !member_id) return NextResponse.json({ error: "event_id and member_id are required" }, { status: 400 });

    const checked_in_at = checked_in ? new Date().toISOString() : null;

    const result = await sql`
      INSERT INTO event_checkins (event_id, member_id, checked_in, checked_in_at)
      VALUES (${event_id}, ${member_id}, ${checked_in}, ${checked_in_at})
      ON CONFLICT (event_id, member_id)
      DO UPDATE SET checked_in = ${checked_in}, checked_in_at = ${checked_in_at}
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating checkin:", error);
    return NextResponse.json({ error: "Failed to update checkin" }, { status: 500 });
  }
}
