# Changelog

Running log of meaningful changes, newest at the top. Add a short bullet when
you ship something. Keep entries terse — this is a memory aid, not an essay.
This is the ONE file where history accumulates; keep the others (README,
ARCHITECTURE, TODO) as current-state snapshots instead.

---

## Custom domain + password-reset security fix

- **Fixed password-reset poisoning vulnerability:** the forgot-password route
  was building the reset URL from `request.headers.get('origin')`, a
  client-controlled header. A forged `Origin` header could send a member a
  valid reset token pointing at an attacker's domain. Changed to use `SITE_URL`
  (hardcoded server-side constant) so the reset link always points at
  `clubneva.com`, regardless of what the request headers say.
- Introduced `lib/site.js` exporting `SITE_URL = 'https://clubneva.com'` as
  the single source of truth for the production domain. All email links, Open
  Graph metadata, and share URLs now import from there — a future domain change
  is a one-line edit.
- Added `metadataBase` to `app/layout.jsx` so relative OG image paths resolve
  correctly under the new domain.
- Updated all hardcoded `neva-website.vercel.app` references (5 in code, docs)
  to use `SITE_URL` or `clubneva.com`.

---

## Security & scaling hardening (audit pass)

- Fixed member-edit 500 error caused by a SQL `CASE` expression with nullable
  parameters (Neon couldn't infer the type). Split into separate statements.
- Made membership approval atomic and server-side: creating the member and
  marking the application approved now happen together, so there's no
  half-approved state and no double-approval risk.
- Enforced event capacity atomically (a full event can no longer be overfilled
  under concurrent registrations) and added a database unique index to prevent
  duplicate registrations.
- Added **server-side admin authorization**: admins get an HMAC-signed token on
  login (`ADMIN_SECRET`); every admin API route verifies it. Previously admin
  checks were client-side only and could be bypassed.
- Hardened login: uniform error message (no account enumeration); blocked login
  for accounts with no password set.
- Stopped exposing member email addresses on public endpoints (leaderboard).
- Made NEVA cash adjustments support atomic deltas so simultaneous admin edits
  don't overwrite each other.

## Features & fixes

- Auto-archive past events (drop off public lists ~4h after end; visible under
  admin "Archived").
- Clarified event payment: registering ≠ paid; pending applicants can register
  for events without waiting for approval.
- Switched email to Gmail SMTP with automatic retries (was failing
  intermittently on Vercel; earlier was blocked by Resend's sandbox domain).
- Added second admin, "maybe" RSVP option, manual guest registration (for
  PlayByPoint signups), and new-event notification emails to members.
- Per-event link previews (Open Graph) so shared event links show the event
  name; fixed generic/duplicate title tags.
- Forced all event times to Pacific (America/Los_Angeles) across the site.
- Fixed mobile layout: sticky elements overflowing, oversized text not scaling,
  hero bee treatment, horizontal-scroll safety net.
- Fixed membership application submission (missing `instagram_handle` column),
  approval emails, forgot-password flow.

## Project setup

- Removed old hardcoded product pages (now uses dynamic `product/[slug]`).
- Added project documentation: README, ARCHITECTURE, TODO, CHANGELOG.

---

_Older history predates this changelog. Going forward, add a bullet here each
time you ship something noteworthy._
