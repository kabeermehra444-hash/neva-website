import "./globals.css";
import { AppGenProvider } from "@/components/appgen-provider";

const SITE_TITLE = "NEVA — Where LA Plays for Real";
const SITE_DESCRIPTION = "A community of serious competitors in Los Angeles. Weekly round robins, real competition, real rewards.";

// Site-wide default metadata. Individual pages (like a specific event or
// product) can override this with their own generateMetadata export —
// Next.js merges/replaces these automatically since this is now a real
// Server Component using the proper Metadata API, instead of hardcoded
// <head> tags that couldn't be overridden per-page.
export const metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'NEVA',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://clubneva.com',
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700,900&display=swap" />
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
      </head>
      <body className="antialiased">
        <AppGenProvider>{children}</AppGenProvider>
      </body>
    </html>
  );
}
