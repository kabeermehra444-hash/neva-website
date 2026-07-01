import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { name, logo_url, description, discount_code, active } = await request.json();
    const result = await sql`
      UPDATE sponsors SET
        name = COALESCE(${name ?? null}, name),
        logo_url = COALESCE(${logo_url ?? null}, logo_url),
        description = COALESCE(${description ?? null}, description),
        discount_code = COALESCE(${discount_code ?? null}, discount_code),
        active = COALESCE(${active ?? null}, active)
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating sponsor:", error);
    return NextResponse.json({ error: "Failed to update sponsor" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM sponsors WHERE id = ${id}`;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete sponsor" }, { status: 500 });
  }
}
