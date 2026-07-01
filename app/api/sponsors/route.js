import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM sponsors ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return NextResponse.json({ error: "Failed to fetch sponsors" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, logo_url, description, discount_code, active = true } = await request.json();
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const result = await sql`
      INSERT INTO sponsors (name, logo_url, description, discount_code, active)
      VALUES (${name}, ${logo_url || null}, ${description || null}, ${discount_code || null}, ${active})
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating sponsor:", error);
    return NextResponse.json({ error: "Failed to create sponsor" }, { status: 500 });
  }
}
