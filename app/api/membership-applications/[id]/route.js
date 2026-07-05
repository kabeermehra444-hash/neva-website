import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/admin-auth";

async function sendApprovalEmail({ first_name, last_name, email }) {
  await sendEmail({
    to: email,
    subject: `You're in — Welcome to Club NEVA`,
    html: `
      <h2>Welcome to Club NEVA, ${first_name}!</h2>
      <p>Your membership application has been approved. You're officially part of the club.</p>
      <p>Log in with the email and password you used to apply to access your member portal, register for events, and track your stats.</p>
      <p style="margin-top:24px"><a href="https://clubneva.com/login">Log In →</a></p>
    `,
  });
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await sql`SELECT * FROM membership_applications WHERE id = ${id}`;
    if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Fetch the application first so we have its details for member creation.
    const appRows = await sql`SELECT * FROM membership_applications WHERE id = ${id}`;
    if (appRows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const app = appRows[0];

    if (status === 'approved') {
      // Approval is a two-part operation (create member + mark approved).
      // Do the member creation FIRST. If it fails, we return an error and
      // leave the application untouched (still pending) — so we never end
      // up with a half-approved state. Creating the member is idempotent:
      // if they already exist (e.g. a retry), we treat that as success
      // rather than erroring, which also prevents double-approval issues.
      if (app.status === 'approved') {
        // Already approved — nothing to do, return success (idempotent).
        return NextResponse.json(app);
      }

      const existing = await sql`SELECT id FROM members WHERE LOWER(email) = ${(app.email || '').toLowerCase().trim()}`;
      if (existing.length === 0) {
        try {
          await sql`
            INSERT INTO members (name, email, approved, neva_cash_balance, password_hash)
            VALUES (
              ${`${app.first_name} ${app.last_name}`.trim()},
              ${app.email},
              true,
              0,
              ${app.password_hash || null}
            )
          `;
        } catch (memberErr) {
          // If it's a duplicate email race, that's fine (member exists now).
          if (!(memberErr.message?.includes('unique') || memberErr.code === '23505')) {
            console.error("Failed to create member during approval:", memberErr);
            return NextResponse.json({ error: "Failed to create member — application left pending." }, { status: 500 });
          }
        }
      }

      // Member exists now — safe to mark the application approved.
      const updated = await sql`
        UPDATE membership_applications SET status = 'approved' WHERE id = ${id} RETURNING *
      `;

      sendApprovalEmail({ first_name: app.first_name, last_name: app.last_name, email: app.email });
      return NextResponse.json(updated[0]);
    }

    // Non-approval status changes (e.g. denied) — simple update.
    const result = await sql`
      UPDATE membership_applications
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
