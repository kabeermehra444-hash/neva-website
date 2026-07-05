import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { pbkdf2Sync } from 'crypto';
import { issueAdminToken } from "@/lib/admin-auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await sql`
      SELECT id, name, email, approved, wins, losses, rank, neva_cash_balance, password_hash
      FROM members
      WHERE LOWER(email) = ${email.toLowerCase().trim()}
    `;

    const member = result[0];

    // Uniform failure response for both "no account" and "wrong password"
    // so an attacker can't tell which emails are registered (prevents
    // account enumeration).
    const genericFail = () =>
      NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

    if (!member) return genericFail();

    // A member with no password_hash cannot log in with a password —
    // previously any password was accepted, which was a security hole.
    if (!member.password_hash) return genericFail();

    const [salt, hash] = member.password_hash.split(':');
    const verify = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    if (verify !== hash) return genericFail();

    // Password is correct. Only now do we surface approval status, so
    // enumeration isn't possible via the "pending" message either.
    if (!member.approved) {
      return NextResponse.json({ error: "pending" }, { status: 403 });
    }

    const { password_hash: _omit, ...memberData } = member;

    // If this is an admin, include a signed admin token the browser will
    // send back on admin-only API calls. Non-admins get no token.
    const adminToken = issueAdminToken(member.email);
    if (adminToken) memberData.adminToken = adminToken;

    return NextResponse.json(memberData);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
