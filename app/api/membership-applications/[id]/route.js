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

    const result = await sql`
      UPDATE membership_applications
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (status === 'approved') {
      const app = result[0];
      sendApprovalEmail({ first_name: app.first_name, last_name: app.last_name, email: app.email });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
