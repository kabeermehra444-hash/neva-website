# Architecture

How Club NEVA is put together. Read this before making structural changes.
Keep it updated when the structure changes — it is meant to be a living
document, not a historical record.

---

## Stack

- **Next.js 15 (App Router)** — pages and API routes live together under `app/`.
- **Neon (serverless PostgreSQL)** — the database. Accessed via
  `@neondatabase/serverless` in `app/api/utils/sql.js`. All data lives here;
  the code is stateless.
- **Vercel** — hosting. Pushing to `main` triggers an automatic deploy.
- **Vercel Blob** — private storage for gallery photos, via `@vercel/blob`.
  Requires `BLOB_READ_WRITE_TOKEN`.
- **Gmail SMTP** (`nodemailer`) — transactional email, via `lib/email.js`.
- **Shopify Buy Buttons** — apparel checkout (client-side embeds).
- **PlayByPoint** — external event-entry payment (linked out per event).

---

## Database Tables

The schema is not stored in the repo — it was created directly in Neon.
Current tables (inferred from the queries in `app/api`):

| Table                     | Holds                                             |
| ------------------------- | ------------------------------------------------- |
| `members`                 | Approved members: name, email, password_hash, wins, losses, rank, neva_cash_balance |
| `membership_applications` | Pending/approved/denied applications              |
| `events`                  | Events: name, date_time, end_time, location, price, capacity, registered_count, dupr_minimum, playbypoint_url, status |
| `event_registrations`     | Who's registered for what. Has rsvp_status ('going'/'maybe'), guest_name/guest_email for non-members. Unique index `uniq_member_event` prevents duplicates. |
| `event_checkins`          | Event-day check-ins                               |
| `dupr_exception_requests` | Requests to join an event below its DUPR minimum  |
| `products`                | Apparel products                                  |
| `orders`, `order_items`   | Shop orders                                       |
| `sponsors`                | Sponsor listings                                  |
| `newsletter_subscribers`  | Newsletter signups                                |
| `password_resets`         | Password reset tokens                             |
| `gallery_photos`          | Event photos: event_id (FK, ON DELETE CASCADE), blob_url, blob_pathname, caption, published (default false) |

> Schema changes are done with one-off scripts (e.g. `migrate.js`) that run
> `ALTER TABLE` against Neon using `DATABASE_URL` from `.env.local`.

---

## Authentication & Authorization

Two separate concepts — don't confuse them:

- **Member sessions (client-side).** On login, member data is stored in
  `localStorage` via `lib/auth.js`. This is only for showing the right UI —
  it is NOT trusted for anything sensitive.
- **Admin authorization (server-side).** This is the security boundary.
  - Admins are listed by email in `lib/admin-auth.js` (`ADMIN_EMAILS`).
  - On login, admins receive an HMAC-signed token (signed with `ADMIN_SECRET`).
  - Every admin-only API route calls `requireAdmin(request)`, which verifies
    the token's signature and expiry. No valid token → 401 Unauthorized.
  - The browser cannot forge this. Client-side `isAdmin()` only controls what
    UI shows; the server is the real gate.

- **Photo access tokens (server-side).** A third, narrower token type in
  `lib/photo-token.js`, also signed with `ADMIN_SECRET`. Browsers cannot attach
  an `Authorization` header to `<img src>` or a download link, so the gallery
  serve route authenticates via a signed `?t=` query parameter instead. Each
  token is bound to a single photo id and expires in 30 minutes, so a URL that
  leaks (browser history, logs, referrer) exposes at most one photo briefly —
  never a 14/30-day session token.

**Consequence:** if `ADMIN_SECRET` changes, all admins must log out and back
in to get a token signed with the new secret.

---

## Key Flows

### Membership
`/membership-apply` → creates a row in `membership_applications` (password
hashed). Admin approves via the admin panel → `PATCH /api/membership-applications/[id]`
with `status: 'approved'`. **This single server call creates the member and
marks the application approved together** (atomic — no half-approved state),
then emails the applicant.

### Events & Registration
Admin creates events in the admin panel. Members/pending applicants register
at `/events/[slug]`. Registration:
- **Capacity is enforced atomically** — the slot is claimed in one
  `UPDATE ... WHERE registered_count < capacity` statement, so a full event
  can't be overfilled under concurrent load.
- **Duplicates are blocked** by the `uniq_member_event` database index.
- **'maybe' RSVPs do not consume a capacity slot**; only 'going' does.
- Events auto-archive ~4 hours after they end (drop off public lists, stay in
  the admin "Archived" section).

### Photo Gallery
Admins upload event photos in the admin panel's Gallery tab. Photos go to
**private** Vercel Blob storage (never a public URL) and are linked to an event.
They default to `published = false` — invisible to members until toggled on.

Members view published photos at `/portal-gallery`, grouped by event, and can
download them. Both sides render images through one proxy route,
`/api/gallery/photos/[id]/serve?t=<token>`, which verifies the photo token,
streams the private blob via the SDK's `get()`, and adds
`Content-Disposition: attachment` when `&download=1` is present. List endpoints
mint the tokens server-side — the member endpoint only ever mints them for
published photos, so unpublished photos are unreachable.

### Email
All email goes through `sendEmail()` in `lib/email.js` (Gmail SMTP, with
automatic retries). To change providers, only that one file changes.

---

## Where Things Live

```
app/api/          Backend. Each folder = one endpoint (route.js).
app/portal-admin  The admin control panel (large single page).
app/portal-*      Member portal pages.
app/events/[slug] Public event page. page.jsx = server (metadata),
                  EventDetailClient.jsx = the interactive client component.
lib/admin-auth.js SERVER-side admin token logic. Security-critical.
lib/member-auth.js SERVER-side member token logic. Security-critical.
lib/photo-token.js SERVER-side short-lived per-photo tokens for gallery URLs.
lib/auth.js       CLIENT-side session + adminHeaders()/memberHeaders() helpers.
lib/email.js      Shared email sender.
lib/timezone.js   All event times are America/Los_Angeles.
```

---

## Conventions / Gotchas

- **Admin API calls from the client must send the token.** Use
  `adminHeaders()` from `lib/auth.js` as the fetch `headers`. Forgetting this
  gives a 401.
- **Browsers don't send auth headers on `<img src>` or download links.** Any
  route serving binary content to an `<img>` or `<a download>` cannot use
  `requireAdmin`/`requireMember` — it will 401. Use a signed query token
  (`lib/photo-token.js`) instead.
- **Don't send `multipart/form-data` with `adminHeaders()`** — it forces
  `Content-Type: application/json` and the multipart boundary is lost. Pass only
  the `Authorization` header and let the browser set `Content-Type` itself.
- **Avoid SQL `CASE` expressions with multiple nullable parameters** — Neon's
  driver can't infer their type and the query fails at runtime. Split into
  separate statements instead. (This caused a real bug once.)
- **All times are Pacific.** Use the helpers in `lib/timezone.js`; don't format
  dates raw.
- **`SITE_URL` in `lib/site.js`** is the single source of truth for the production domain (`clubneva.com`). All email links, OG metadata, and share URLs import from there — a future domain change is a one-line edit.
