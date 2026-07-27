import { NextResponse } from 'next/server';
import { requireMember } from '@/lib/member-auth';
import { issuePhotoToken } from '@/lib/photo-token';
import sql from '@/app/api/utils/sql';

// Members only ever see published photos. Unpublished photos are invisible
// here and get no view token, so there is no way to reach them via /serve.
export async function GET(request) {
  const auth = requireMember(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  try {
    const rows = eventId
      ? await sql`
          SELECT p.id, p.event_id, p.caption, p.uploaded_at,
                 e.name AS event_name, e.date_time AS event_date
          FROM gallery_photos p
          JOIN events e ON e.id = p.event_id
          WHERE p.published = TRUE AND p.event_id = ${eventId}
          ORDER BY p.uploaded_at DESC
        `
      : await sql`
          SELECT p.id, p.event_id, p.caption, p.uploaded_at,
                 e.name AS event_name, e.date_time AS event_date
          FROM gallery_photos p
          JOIN events e ON e.id = p.event_id
          WHERE p.published = TRUE
          ORDER BY e.date_time DESC NULLS LAST, p.uploaded_at DESC
        `;

    return NextResponse.json(rows.map(r => ({ ...r, view_token: issuePhotoToken(r.id) })));
  } catch (error) {
    console.error('Error fetching member gallery photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
