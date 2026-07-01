import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO newsletter_subscribers (email)
      VALUES (${email.toLowerCase().trim()})
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('unique')) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
    }
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
