import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      slug,
      name,
      description,
      price,
      category,
      size_options,
      image_url,
      active
    } = body;

    const updates = [];
    if (slug !== undefined) updates.push(sql`slug = ${slug}`);
    if (name !== undefined) updates.push(sql`name = ${name}`);
    if (description !== undefined) updates.push(sql`description = ${description}`);
    if (price !== undefined) updates.push(sql`price = ${price}`);
    if (category !== undefined) updates.push(sql`category = ${category}`);
    if (size_options !== undefined) updates.push(sql`size_options = ${size_options}`);
    if (image_url !== undefined) updates.push(sql`image_url = ${image_url}`);
    if (active !== undefined) updates.push(sql`active = ${active}`);

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(sql`updated_at = NOW()`);

    const result = await sql`
      UPDATE products 
      SET ${sql(updates.map((_, i) => updates[i]).join(', '))}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}