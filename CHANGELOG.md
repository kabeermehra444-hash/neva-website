# Changelog

Running log of meaningful changes, newest at the top. Add a short bullet when
you ship something. Keep entries terse — this is a memory aid, not an essay.
This is the ONE file where history accumulates; keep the others (README,
ARCHITECTURE, TODO) as current-state snapshots instead.

---

## Add members-only photo gallery (admin upload + member viewing/download)

- `scripts/migrate-gallery.js`: creates the `gallery_photos` table (event FK with
  `ON DELETE CASCADE`, private Vercel Blob URL, `published` defaulting to false).
- `app/api/gallery/photos/route.js`: admin GET (list by event) and POST (multipart
  upload to private Vercel Blob, one DB row per file).
- `app/api/gallery/photos/[id]/route.js`: admin PATCH (caption / published toggle)
  and DELETE (blob `del()` then DB row).
- `app/api/gallery/photos/[id]/serve/route.js`: image proxy shared by admins and
  members. Streams the private blob via the SDK's `get()`; adds
  `Content-Disposition: attachment` when `&download=1`.
- `app/api/gallery/member-photos/route.js`: member-facing list, **published photos
  only**, joined with event name/date.
- `lib/photo-token.js`: new short-lived (30 min), per-photo HMAC token.
  Browsers cannot attach an `Authorization` header to `<img src>` or a download
  link, so the serve route authenticates via a signed `?t=` query param instead
  of `requireAdmin`/`requireMember` — which would have 401'd every thumbnail.
  Tokens are minted server-side by the list endpoints only, and the member
  endpoint mints them only for published photos, so drafts stay unreachable.
- `app/portal-admin/page.jsx`: new Gallery tab with event selector, multi-file
  upload, and a photo grid with publish toggle, download, and delete per card.
- `app/portal-gallery/page.jsx`: new members-only gallery — published photos
  grouped by event, click-to-zoom lightbox, and per-photo download.
- `components/PortalNav.jsx`: added the Gallery link to member nav.
- Added `@vercel/blob` to dependencies. Requires `BLOB_READ_WRITE_TOKEN`.

---

## Fix silent email failures in password-reset flow

- `lib/email.js`: `sendEmail` now throws on terminal failure (missing
  credential or SMTP exhausted after 3 retries) instead of returning
  `false`. Per-attempt errors are still logged; callers can no longer
  mistake a failed send for a success.
- `forgot-password/route.js`: replaced fire-and-forget call with
  `await sendResetEmail(...)` wrapped in an inner try/catch. Send
  failures are now logged server-side (`console.error`). User-facing
  response is still a uniform 200 regardless of whether the email
  was found or the send succeeded — anti-enumeration behavior preserved.

---

## Member token auth (gallery phase 1)

- Added `lib/member-auth.js`: server-side HMAC-SHA256 member token system
  mirroring `lib/admin-auth.js` — `issueMemberToken`, `verifyMemberToken`,
  `requireMember`. Payload includes `type:'member'`, `id`, `email`, `exp`
  (30-day TTL). Expiry and signature are both verified server-side on every
  protected request.
- Login route (`/api/auth/login`) now returns `memberToken` for all approved
  members alongside the existing `adminToken` (admins get both). Change is
  purely additive — no existing fields altered.
- `lib/auth.js`: added `getMemberToken()` and `memberHeaders()` client helpers;
  `setStoredMember`/`clearStoredMember` updated to persist/clear `neva_memberToken`.
- Known tradeoff: a revoked member retains gallery access until token expiry
  (14 days), matching existing admin token behavior. Deliberate accepted design.

---

## SEO: pickleball keyword + homepage metadata

- Homepage title: "Club NEVA — Pickleball Club in Los Angeles"
- Homepage meta description mentions pickleball, round robins, Los Angeles
- Canonical URL added to homepage metadata pointing at `clubneva.com`
- Hero eyebrow changed to "NEVA · PICKLEBALL · LOS ANGELES"
- Hero tagline now reads "...create a pickleball community that extends beyond the court"
- How It Works step 01 body copy now mentions "pickleball events" naturally
- Split `app/page.jsx` into a thin server wrapper (metadata export) and
  `app/HomeClient.jsx` ('use client') — required by Next.js App Router since
  client components cannot export metadata

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
