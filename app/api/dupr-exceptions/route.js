import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

async function sendExceptionEmail({ name, email, message, event_id }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'NEVA <onboarding@resend.dev>',
        to: ['kabeermehra444@gmail.com', 'eva.vacadev@gmail.com'],
        subject: `DUPR Exception Request — ${name}`,
        html: `
          <h2>DUPR Exception Request</h2>
          <p><strong>Event ID:</strong> ${event_id || 'N/A'}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${message || '(none)'}</blockquote>
        `,
      }),
    });
  } catch (err) {
    console.error('Failed to send DUPR exception email:', err);
  }
}

export async function POST(request) {
  try {
    const { name, email, message, event_id } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO dupr_exception_requests (name, email, message, event_id)
      VALUES (${name}, ${email}, ${message || null}, ${event_id || null})
      RETURNING *
    `;

    sendExceptionEmail({ name, email, message, event_id });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error saving DUPR exception:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
