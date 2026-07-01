import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { pbkdf2Sync } from 'crypto';

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

    if (result.length === 0) {
      return NextResponse.json({ error: "No account found with that email address." }, { status: 401 });
    }

    const member = result[0];

    if (!member.approved) {
      return NextResponse.json({ error: "pending" }, { status: 403 });
    }

    if (member.password_hash) {
      const [salt, hash] = member.password_hash.split(':');
      const verify = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      if (verify !== hash) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
      }
    }

    const { password_hash: _omit, ...memberData } = member;
    return NextResponse.json(memberData);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
