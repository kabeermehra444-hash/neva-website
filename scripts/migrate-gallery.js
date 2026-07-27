import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS gallery_photos (
    id            SERIAL PRIMARY KEY,
    event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    blob_url      TEXT NOT NULL,
    blob_pathname TEXT NOT NULL,
    caption       TEXT,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published     BOOLEAN NOT NULL DEFAULT FALSE
  )
`;

await sql`
  CREATE INDEX IF NOT EXISTS gallery_photos_event_id_idx
  ON gallery_photos(event_id)
`;

console.log('gallery_photos table ready.');
