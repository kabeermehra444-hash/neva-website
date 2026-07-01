import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log('[TEST API] Checking database connection...');
    
    // Try to fetch products
    const products = await sql`SELECT * FROM products LIMIT 1`;
    
    console.log('[TEST API] Query result:', products);
    
    return NextResponse.json({
      status: 'ok',
      message: 'Database connection works',
      productsFound: products.length > 0,
      sampleProduct: products[0] || null
    });
  } catch (error) {
    console.error('[TEST API] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      error: error.toString()
    }, { status: 500 });
  }
}
