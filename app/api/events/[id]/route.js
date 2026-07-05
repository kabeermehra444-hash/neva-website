import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT * FROM events WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    // event_registrations has NO ACTION FK so we delete those first.
    // event_checkins has CASCADE and dupr_exception_requests has SET NULL,
    // so both are handled automatically by the events DELETE.
    await sql`DELETE FROM event_registrations WHERE event_id = ${id}`;
    const result = await sql`DELETE FROM events WHERE id = ${id} RETURNING id`;
    if (result.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const { name, description, location, date_time, end_time, price, capacity, dupr_minimum, playbypoint_url, status } = await request.json();

    const result = await sql`
      UPDATE events SET
        name            = COALESCE(${name            ?? null}, name),
        description     = COALESCE(${description     ?? null}, description),
        location        = COALESCE(${location        ?? null}, location),
        date_time       = COALESCE(${date_time       ?? null}, date_time),
        end_time        = COALESCE(${end_time        ?? null}, end_time),
        price           = COALESCE(${price           ?? null}, price),
        capacity        = COALESCE(${capacity        ?? null}, capacity),
        dupr_minimum    = COALESCE(${dupr_minimum    ?? null}, dupr_minimum),
        playbypoint_url = COALESCE(${playbypoint_url ?? null}, playbypoint_url),
        status          = COALESCE(${status          ?? null}, status)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}