import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { verifyPhotoToken } from '@/lib/photo-token';
import sql from '@/app/api/utils/sql';

// Derives a friendly download filename from the stored blob pathname,
// which looks like gallery/<eventId>/<timestamp>-<original name>.
function downloadFilename(pathname) {
  const base = pathname.split('/').pop() || 'photo.jpg';
  return base.replace(/^\d+-/, '');
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    if (!verifyPhotoToken(searchParams.get('t'), id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`SELECT blob_url, blob_pathname FROM gallery_photos WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const result = await get(rows[0].blob_url, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || !result.stream) return NextResponse.json({ error: 'Blob not found' }, { status: 404 });

    const headers = {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=1800',
    };
    if (searchParams.get('download') === '1') {
      const name = downloadFilename(rows[0].blob_pathname).replace(/"/g, '');
      headers['Content-Disposition'] = `attachment; filename="${name}"`;
    }

    return new Response(result.stream, { headers });
  } catch (error) {
    console.error('Error serving gallery photo:', error);
    return NextResponse.json({ error: 'Failed to serve photo' }, { status: 500 });
  }
}
