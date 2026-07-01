import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { randomBytes } from 'crypto';

async function sendResetEmail(email, name, resetUrl) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'NEVA <onboarding@resend.dev>',
        to: email,
        subject: 'Reset your NEVA password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 0">
            <h2 style="font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Password Reset</h2>
            <p style="color:#444;margin-bottom:16px">Hi ${name},</p>
            <p style="color:#444;margin-bottom:24px">We received a request to reset your NEVA password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
            <p style="margin:32px 0">
              <a href="${resetUrl}" style="background:#000;color:#fff;padding:14px 28px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;border-radius:8px;display:inline-block">Reset Password</a>
            </p>
            <p style="color:#888;font-size:13px">If you didn't request this, ignore this email — your password won't change.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
            <p style="color:#bbb;font-size:12px">NEVA — Los Angeles</p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error('Failed to send reset email:', err);
  }
}

export async function POST(request) {
  // Generic response used whether or not the email exists — prevents email enumeration
  const GENERIC_OK = NextResponse.json({ ok: true });

  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const rows = await sql`
      SELECT id, name, email
      FROM members
      WHERE LOWER(email) = ${email.toLowerCase().trim()}
        AND approved = true
    `;

    if (rows.length === 0) return GENERIC_OK;

    const member = rows[0];
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing live tokens for this member
    await sql`
      UPDATE password_resets SET used = true
      WHERE member_id = ${member.id} AND used = false
    `;

    await sql`
      INSERT INTO password_resets (member_id, token, expires_at)
      VALUES (${member.id}, ${token}, ${expiresAt.toISOString()})
    `;

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${token}`;

    // Fire-and-forget
    sendResetEmail(member.email, member.name || 'Member', resetUrl);

    return GENERIC_OK;
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
