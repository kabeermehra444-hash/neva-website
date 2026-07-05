import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";

async function notifyMembersOfNewEvent(event) {
  const members = await sql`SELECT email FROM members WHERE approved = true`;
  const emails = members.map(m => m.email).filter(Boolean);
  if (emails.length === 0) return;

  const dateStr = event.date_time
    ? new Date(event.date_time).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles',
      })
    : '';

  await sendEmail({
    to: 'kabeermehra444@gmail.com',
    bcc: emails,
    subject: `New Event: ${event.name}`,
    html: `
      <h2>${event.name}</h2>
      ${dateStr ? `<p><strong>${dateStr}</strong></p>` : ''}
      ${event.location ? `<p>${event.location}</p>` : ''}
      ${event.description ? `<p>${event.description}</p>` : ''}
      <p style="margin-top:24px"><a href="https://clubneva.com/events/${event.id}">View Event & Register →</a></p>
    `,
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const event_type = searchParams.get("event_type");
    // archived=true → only past events. archived=all → both. anything else → only upcoming.
    // An event is "past" once its end_time (or date_time if no end_time)
    // is more than 4 hours behind now — the grace period keeps a live
    // event visible on its own day even after start.
    const archived = searchParams.get("archived");
    const showPast = archived === 'true';
    const showAll = archived === 'all';

    let events;
    if (showAll) {
      // Admin view — everything
      if (status && event_type) {
        events = await sql`SELECT * FROM events WHERE status = ${status} AND event_type = ${event_type} ORDER BY date_time DESC`;
      } else if (status) {
        events = await sql`SELECT * FROM events WHERE status = ${status} ORDER BY date_time DESC`;
      } else if (event_type) {
        events = await sql`SELECT * FROM events WHERE event_type = ${event_type} ORDER BY date_time DESC`;
      } else {
        events = await sql`SELECT * FROM events ORDER BY date_time DESC`;
      }
    } else if (showPast) {
      // Past-only view
      if (status && event_type) {
        events = await sql`SELECT * FROM events WHERE status = ${status} AND event_type = ${event_type} AND COALESCE(end_time, date_time) < NOW() - INTERVAL '4 hours' ORDER BY date_time DESC`;
      } else if (status) {
        events = await sql`SELECT * FROM events WHERE status = ${status} AND COALESCE(end_time, date_time) < NOW() - INTERVAL '4 hours' ORDER BY date_time DESC`;
      } else if (event_type) {
        events = await sql`SELECT * FROM events WHERE event_type = ${event_type} AND COALESCE(end_time, date_time) < NOW() - INTERVAL '4 hours' ORDER BY date_time DESC`;
      } else {
        events = await sql`SELECT * FROM events WHERE COALESCE(end_time, date_time) < NOW() - INTERVAL '4 hours' ORDER BY date_time DESC`;
      }
    } else {
      // Default — upcoming only
      if (status && event_type) {
        events = await sql`SELECT * FROM events WHERE status = ${status} AND event_type = ${event_type} AND (date_time IS NULL OR COALESCE(end_time, date_time) >= NOW() - INTERVAL '4 hours') ORDER BY date_time ASC`;
      } else if (status) {
        events = await sql`SELECT * FROM events WHERE status = ${status} AND (date_time IS NULL OR COALESCE(end_time, date_time) >= NOW() - INTERVAL '4 hours') ORDER BY date_time ASC`;
      } else if (event_type) {
        events = await sql`SELECT * FROM events WHERE event_type = ${event_type} AND (date_time IS NULL OR COALESCE(end_time, date_time) >= NOW() - INTERVAL '4 hours') ORDER BY date_time ASC`;
      } else {
        events = await sql`SELECT * FROM events WHERE (date_time IS NULL OR COALESCE(end_time, date_time) >= NOW() - INTERVAL '4 hours') ORDER BY date_time ASC`;
      }
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
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