import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Public callers (e.g. the leaderboard) never receive email addresses.
    // Only admins get the full records including emails.
    const isAdminReq = !requireAdmin(request).error;

    let members;
    if (status === 'approved') {
      members = isAdminReq
        ? await sql`SELECT id, name, email, approved, wins, losses, rank, neva_cash_balance, created_at, updated_at FROM members WHERE approved = true ORDER BY wins DESC, created_at DESC`
        : await sql`SELECT id, name, approved, wins, losses, rank, neva_cash_balance, created_at FROM members WHERE approved = true ORDER BY wins DESC, created_at DESC`;
    } else {
      // Full (non-approved-filtered) list is admin-only.
      if (!isAdminReq) {
        members = await sql`SELECT id, name, approved, wins, losses, rank, neva_cash_balance, created_at FROM members WHERE approved = true ORDER BY wins DESC, created_at DESC`;
      } else {
        members = await sql`SELECT id, name, email, approved, wins, losses, rank, neva_cash_balance, created_at, updated_at FROM members ORDER BY wins DESC, created_at DESC`;
      }
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const {
      name, email, approved = false, rank, neva_cash_balance = 0, password_hash = null
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO members (name, email, approved, rank, neva_cash_balance, password_hash)
      VALUES (${name}, ${email}, ${approved}, ${rank || null}, ${neva_cash_balance}, ${password_hash})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
