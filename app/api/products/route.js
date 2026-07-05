import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request) {
  try {
    console.log('[API] GET /api/products called');
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    console.log('[API] Query params:', { category, active });

    let products;
    if (category && active !== null) {
      console.log('[API] Fetching by category AND active');
      products = await sql`
        SELECT * FROM products 
        WHERE category = ${category} AND active = ${active === 'true'}
        ORDER BY created_at DESC
      `;
    } else if (category) {
      console.log('[API] Fetching by category only');
      products = await sql`
        SELECT * FROM products 
        WHERE category = ${category}
        ORDER BY created_at DESC
      `;
    } else if (active !== null) {
      console.log('[API] Fetching by active only');
      products = await sql`
        SELECT * FROM products 
        WHERE active = ${active === 'true'}
        ORDER BY created_at DESC
      `;
    } else {
      console.log('[API] Fetching ALL products (no filters)');
      products = await sql`
        SELECT * FROM products 
        ORDER BY created_at DESC
      `;
    }

    console.log('[API] Products query result:', {
      rowCount: products?.length,
      isArray: Array.isArray(products),
      sample: products?.[0]
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[API] Error fetching products:", error);
    console.error("[API] Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return NextResponse.json({ 
      error: "Failed to fetch products",
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const {
      slug,
      name,
      description,
      price,
      category,
      size_options,
      image_url,
      active = true
    } = body;

    if (!slug || !name || !description || price === undefined || !category || !size_options) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO products (
        slug, name, description, price, category, size_options, image_url, active
      )
      VALUES (
        ${slug}, ${name}, ${description}, ${price}, ${category}, ${size_options}, ${image_url || null}, ${active}
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: "Product slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}