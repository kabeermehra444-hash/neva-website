import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await sql`
      SELECT id, name, email, approved, wins, losses, rank, neva_cash_balance, created_at, updated_at
      FROM members
      WHERE id = ${id}
    `;
    if (result.length === 0) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json({ error: "Failed to fetch member" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const { name, email, approved, wins, losses, rank, neva_cash_balance, neva_cash_delta } = await request.json();

    // If neva_cash_delta is provided, adjust the balance atomically
    // (balance = balance + delta) so two admins editing at once can't
    // silently overwrite each other. Otherwise fall back to setting an
    // absolute value.
    const result = await sql`
      UPDATE members SET
        name              = COALESCE(${name              ?? null}, name),
        email             = COALESCE(${email             ?? null}, email),
        approved          = COALESCE(${approved          ?? null}, approved),
        wins              = COALESCE(${wins              ?? null}, wins),
        losses            = COALESCE(${losses            ?? null}, losses),
        rank              = COALESCE(${rank              ?? null}, rank),
        neva_cash_balance = CASE
          WHEN ${neva_cash_delta ?? null} IS NOT NULL THEN COALESCE(neva_cash_balance, 0) + ${neva_cash_delta ?? 0}
          ELSE COALESCE(${neva_cash_balance ?? null}, neva_cash_balance)
        END,
        updated_at        = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
