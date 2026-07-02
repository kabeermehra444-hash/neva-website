import sql from "@/app/api/utils/sql";
import EventDetailClient from "./EventDetailClient";

async function getEvent(slug) {
  try {
    const result = await sql`
      SELECT name, description
      FROM events
      WHERE id::text = ${slug}
      LIMIT 1
    `;
    return result[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    const title = 'Event — NEVA';
    const description = "A community of serious competitors in Los Angeles. Weekly round robins, real competition, real rewards.";
    return {
      title,
      description,
      openGraph: { title, description, siteName: 'NEVA', type: 'website' },
      twitter: { card: 'summary', title, description },
    };
  }

  const title = `${event.name} — NEVA`;
  const description = event.description || "A community of serious competitors in Los Angeles. Weekly round robins, real competition, real rewards.";
  const url = `https://clubneva.com/events/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'NEVA',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}
