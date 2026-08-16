import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/admin-auth';
import { issuePhotoToken } from '@/lib/photo-token';
import sql from '@/app/api/utils/sql';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

  try {
    const rows = await sql`
      SELECT * FROM gallery_photos
      WHERE event_id = ${eventId}
      ORDER BY uploaded_at DESC
    `;
    return NextResponse.json(rows.map(r => ({ ...r, view_token: issuePhotoToken(r.id) })));
  } catch (error) {
    console.error('Error fetching gallery photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const eventId = formData.get('event_id');
    if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 });

    const files = formData.getAll('file');
    if (!files.length) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

    const caption = formData.get('caption') || null;
    const created = [];

    for (const file of files) {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const resized = await sharp(inputBuffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Store with .jpg extension regardless of the original format.
      const baseName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      const pathname = `gallery/${eventId}/${Date.now()}-${baseName}`;
      const blob = await put(pathname, resized, {
        access: 'private',
        contentType: 'image/jpeg',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const rows = await sql`
        INSERT INTO gallery_photos (event_id, blob_url, blob_pathname, caption)
        VALUES (${eventId}, ${blob.url}, ${blob.pathname}, ${caption})
        RETURNING *
      `;
      created.push(rows[0]);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error uploading gallery photos:', error);
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 });
  }
}
