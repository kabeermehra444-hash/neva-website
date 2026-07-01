import sql from "@/app/api/utils/sql";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const member_id = searchParams.get("member_id");
    const status = searchParams.get("status");
    const payment_status = searchParams.get("payment_status");

    let orders;
    if (member_id && status) {
      orders = await sql`
        SELECT * FROM orders 
        WHERE member_id = ${member_id} AND status = ${status}
        ORDER BY created_at DESC
      `;
    } else if (member_id) {
      orders = await sql`
        SELECT * FROM orders 
        WHERE member_id = ${member_id}
        ORDER BY created_at DESC
      `;
    } else if (status) {
      orders = await sql`
        SELECT * FROM orders 
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else if (payment_status) {
      orders = await sql`
        SELECT * FROM orders 
        WHERE payment_status = ${payment_status}
        ORDER BY created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT * FROM orders 
        ORDER BY created_at DESC
      `;
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      member_id,
      order_number,
      status = 'pending',
      subtotal,
      neva_cash_applied = 0,
      total,
      shipping_name,
      shipping_email,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country = 'United States',
      payment_status = 'unpaid',
      items = []
    } = body;

    if (!order_number || subtotal === undefined || total === undefined || !shipping_name || !shipping_email || !shipping_address_line1 || !shipping_city || !shipping_state || !shipping_postal_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const orderResult = await sql`
      INSERT INTO orders (
        member_id, order_number, status, subtotal, neva_cash_applied, total,
        shipping_name, shipping_email, shipping_phone, shipping_address_line1,
        shipping_address_line2, shipping_city, shipping_state, shipping_postal_code,
        shipping_country, payment_status
      )
      VALUES (
        ${member_id || null}, ${order_number}, ${status}, ${subtotal}, ${neva_cash_applied}, ${total},
        ${shipping_name}, ${shipping_email}, ${shipping_phone || null}, ${shipping_address_line1},
        ${shipping_address_line2 || null}, ${shipping_city}, ${shipping_state}, ${shipping_postal_code},
        ${shipping_country}, ${payment_status}
      )
      RETURNING *
    `;

    const order = orderResult[0];

    if (items.length > 0) {
      for (const item of items) {
        await sql`
          INSERT INTO order_items (
            order_id, product_id, product_name, size, quantity, unit_price, line_total
          )
          VALUES (
            ${order.id}, ${item.product_id}, ${item.product_name}, ${item.size},
            ${item.quantity}, ${item.unit_price}, ${item.line_total}
          )
        `;
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    if (error.message?.includes('unique')) {
      return NextResponse.json({ error: "Order number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}