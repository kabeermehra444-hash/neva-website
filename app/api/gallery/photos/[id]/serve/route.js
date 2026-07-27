import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import sql from '@/app/api/utils/sql';

export async function GET(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const rows = await sql`SELECT blob_url FROM gallery_photos WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const blobRes = await fetch(rows[0].blob_url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });

    if (!blobRes.ok) return NextResponse.json({ error: 'Blob not found' }, { status: 404 });

    return new Response(blobRes.body, {
      headers: { 'Content-Type': blobRes.headers.get('Content-Type') || 'image/jpeg' },
    });
  } catch (error) {
    console.error('Error serving gallery photo:', error);
    return NextResponse.json({ error: 'Failed to serve photo' }, { status: 500 });
  }
}
