'use client';

import "./globals.css";
import { AppGenProvider } from "@/components/appgen-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>NEVA — Where LA Plays for Real</title>
        <meta name="description" content="A community of serious competitors in Los Angeles. Weekly round robins, real competition, real rewards." />

        {/* Open Graph (iMessage, WhatsApp, Slack, Facebook, LinkedIn) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NEVA" />
        <meta property="og:title" content="NEVA — Where LA Plays for Real" />
        <meta property="og:description" content="A community of serious competitors in Los Angeles. Weekly round robins, real competition, real rewards." />
        <meta property="og:url" content="https://clubneva.com" />

        {/* Twitter/X Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="NEVA — Where LA Plays for Real" />
        <meta name="twitter:description" content="A community of serious competitors in Los Angeles. Weekly round robins, real competition, real rewards." />

        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700,900&display=swap" />
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
      </head>
      <body className="antialiased">
        <AppGenProvider>{children}</AppGenProvider>
      </body>
    </html>
  );
}
