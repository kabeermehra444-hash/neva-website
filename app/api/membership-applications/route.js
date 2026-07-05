import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { pbkdf2Sync, randomBytes } from 'crypto';
import { sendEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/admin-auth";

async function sendNewApplicationEmail({ first_name, last_name, email, why_join }) {
  await sendEmail({
    to: ['kabeermehra444@gmail.com', 'eva.vacadev@gmail.com'],
    subject: `New Membership Application — ${first_name} ${last_name}`,
    html: `
      <h2>New Membership Application</h2>
      <p><strong>Name:</strong> ${first_name} ${last_name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Why they want to join:</strong></p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${why_join || '(not provided)'}</blockquote>
      <p style="margin-top:24px"><a href="https://clubneva.com/portal-admin">Review in Admin Panel →</a></p>
    `,
  });
}

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let applications;
    if (status) {
      applications = await sql`
        SELECT * FROM membership_applications 
        WHERE status = ${status}
        ORDER BY submitted_at DESC
      `;
    } else {
      applications = await sql`
        SELECT * FROM membership_applications 
        ORDER BY submitted_at DESC
      `;
    }

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching membership applications:", error);
    return NextResponse.json({ error: "Failed to fetch membership applications" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      skill_level,
      experience,
      why_join,
      password,
      status = 'pending'
    } = body;

    if (!first_name || !last_name || !email || !skill_level) {
      return NextResponse.json(
        { error: "first_name, last_name, email, and skill_level are required" },
        { status: 400 }
      );
    }

    let password_hash = null;
    if (password) {
      const salt = randomBytes(16).toString('hex');
      const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      password_hash = `${salt}:${hash}`;
    }

    const result = await sql`
      INSERT INTO membership_applications (
        first_name, last_name, email, phone, skill_level, experience, why_join, status, password_hash
      )
      VALUES (
        ${first_name}, ${last_name}, ${email},
        ${phone || null}, ${skill_level}, ${experience || null}, ${why_join || null}, ${status}, ${password_hash}
      )
      RETURNING *
    `;

    // Fire-and-forget — don't block the response if email fails
    sendNewApplicationEmail({ first_name, last_name, email, why_join });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating membership application:", error);
    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: "An application with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create membership application" }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { id, status, notes, member_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Application id is required" }, { status: 400 });
    }

    const reviewed_at = status ? new Date().toISOString() : null;

    const result = await sql`
      UPDATE membership_applications 
      SET 
        status = COALESCE(${status}, status),
        notes = COALESCE(${notes}, notes),
        member_id = COALESCE(${member_id}, member_id),
        reviewed_at = COALESCE(${reviewed_at}, reviewed_at)
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating membership application:", error);
    return NextResponse.json({ error: "Failed to update membership application" }, { status: 500 });
  }
}