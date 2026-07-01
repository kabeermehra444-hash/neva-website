import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { pbkdf2Sync, randomBytes } from 'crypto';

// GET /api/reset-password?token=XXX — validate a token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 });

    const rows = await sql`
      SELECT pr.id, pr.expires_at, pr.used, m.name
      FROM password_resets pr
      JOIN members m ON m.id = pr.member_id
      WHERE pr.token = ${token}
    `;

    if (rows.length === 0) return NextResponse.json({ valid: false, error: 'Invalid reset link.' });

    const reset = rows[0];
    if (reset.used)                              return NextResponse.json({ valid: false, error: 'This link has already been used.' });
    if (new Date(reset.expires_at) < new Date()) return NextResponse.json({ valid: false, error: 'This link has expired. Please request a new one.' });

    return NextResponse.json({ valid: true, name: reset.name });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate link.' }, { status: 500 });
  }
}

// POST /api/reset-password — apply new password
export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    if (password.length < 8)  return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const rows = await sql`
      SELECT pr.id, pr.member_id, pr.expires_at, pr.used
      FROM password_resets pr
      WHERE pr.token = ${token}
    `;

    if (rows.length === 0)                         return NextResponse.json({ error: 'Invalid reset link.' }, { status: 400 });
    if (rows[0].used)                              return NextResponse.json({ error: 'This link has already been used.' }, { status: 400 });
    if (new Date(rows[0].expires_at) < new Date()) return NextResponse.json({ error: 'This link has expired.' }, { status: 400 });

    const { id: resetId, member_id } = rows[0];

    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

    await sql`UPDATE members SET password_hash = ${`${salt}:${hash}`} WHERE id = ${member_id}`;
    await sql`UPDATE password_resets SET used = true WHERE id = ${resetId}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
