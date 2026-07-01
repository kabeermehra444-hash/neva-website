'use client';

import "./globals.css";
import { AppGenProvider } from "@/components/appgen-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>NEVA — Where LA Plays for Real</title>
        <meta name="description" content="A community of serious competitors in Los Angeles. Weekly round robins, real competition, real rewards." />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700,900&display=swap" />
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
      </head>
      <body className="antialiased">
        <AppGenProvider>{children}</AppGenProvider>
      </body>
    </html>
  );
}
