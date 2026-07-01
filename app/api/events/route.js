import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const event_type = searchParams.get("event_type");

    let events;
    if (status && event_type) {
      events = await sql`
        SELECT * FROM events 
        WHERE status = ${status} AND event_type = ${event_type}
        ORDER BY date_time ASC
      `;
    } else if (status) {
      events = await sql`
        SELECT * FROM events 
        WHERE status = ${status}
        ORDER BY date_time ASC
      `;
    } else if (event_type) {
      events = await sql`
        SELECT * FROM events 
        WHERE event_type = ${event_type}
        ORDER BY date_time ASC
      `;
    } else {
      events = await sql`
        SELECT * FROM events 
        ORDER BY date_time ASC
      `;
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      name,
      description,
      location,
      date_time,
      end_time,
      price,
      capacity,
      dupr_minimum,
      playbypoint_url,
      status = 'upcoming'
    } = body;

    const eventName = title || name;
    if (!eventName || !date_time) {
      return NextResponse.json({ error: "title and date_time are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO events (name, description, location, date_time, end_time, price, capacity, dupr_minimum, playbypoint_url, status, created_at)
      VALUES (${eventName}, ${description || null}, ${location || null}, ${date_time}, ${end_time || null}, ${price || null}, ${capacity || null}, ${dupr_minimum || null}, ${playbypoint_url || null}, ${status}, NOW())
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}