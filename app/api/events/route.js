import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

async function notifyMembersOfNewEvent(event) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const members = await sql`SELECT email FROM members WHERE approved = true`;
    const emails = members.map(m => m.email).filter(Boolean);
    if (emails.length === 0) return;

    const dateStr = event.date_time
      ? new Date(event.date_time).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
        })
      : '';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'NEVA <onboarding@resend.dev>',
        to: 'NEVA <onboarding@resend.dev>',
        bcc: emails,
        subject: `New Event: ${event.name}`,
        html: `
          <h2>${event.name}</h2>
          ${dateStr ? `<p><strong>${dateStr}</strong></p>` : ''}
          ${event.location ? `<p>${event.location}</p>` : ''}
          ${event.description ? `<p>${event.description}</p>` : ''}
          <p style="margin-top:24px"><a href="https://clubneva.com/events/${event.id}">View Event & Register →</a></p>
        `,
      }),
    });
  } catch (err) {
    console.error('Failed to send new event notification:', err);
  }
}

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

    notifyMembersOfNewEvent(result[0]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}