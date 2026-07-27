import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import sql from '@/app/api/utils/sql';

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { caption, published } = await request.json();

    const rows = await sql`
      UPDATE gallery_photos SET
        caption = COALESCE(${caption ?? null}, caption),
        published = COALESCE(${published ?? null}, published)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating gallery photo:', error);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const rows = await sql`SELECT blob_url FROM gallery_photos WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await del(rows[0].blob_url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    await sql`DELETE FROM gallery_photos WHERE id = ${id}`;

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting gallery photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
