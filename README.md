# Club NEVA — Membership & Events Website

The official website for **Club NEVA**, a Los Angeles club running round-robin
events and a competitive apparel brand (**NEVA**). Members apply online, get
approved by an admin, then register for events, track stats, and shop apparel.

**Live site:** https://clubneva.com

---

## Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 15 (App Router)                       |
| Styling    | Tailwind CSS                                  |
| Database   | Neon (serverless PostgreSQL)                  |
| Hosting    | Vercel (auto-deploys from the `main` branch)  |
| Email      | Gmail SMTP via `nodemailer`                   |
| Payments   | Shopify Buy Buttons (apparel), PlayByPoint (event entry) |

---

## Getting Started (local development)

```bash
npm install
npm run dev        # runs at http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (run this before pushing to catch errors)
npm run start      # serve the production build locally
npm run lint       # lint check
```

To run locally against the real database, pull the environment variables from
Vercel:

```bash
vercel env pull .env.local
```

---

## Environment Variables

Set these in the Vercel project (Settings → Environment Variables). None of
them belong in the repo.

| Variable             | Purpose                                                        |
| -------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`       | Neon PostgreSQL connection string                             |
| `ADMIN_SECRET`       | Secret used to sign admin session tokens (see Security below) |
| `GMAIL_APP_PASSWORD` | Google App Password used to send email via Gmail SMTP         |
| `APP_ID`             | App identifier for the file-upload service                    |
| `APP_UPLOAD_SECRET`  | Secret for the file-upload service                            |
| `APPGEN_UPLOAD_URL`  | Upload service base URL (optional; has a default)             |

> **Important:** `ADMIN_SECRET` must be set, or no one can access admin
> functions. After changing it, all admins must log out and back in.

---

## How the Site Works

### Membership flow
1. A visitor applies at `/membership-apply` (creates a pending application,
   with a hashed password).
2. An admin approves or denies it in the admin panel. **Approval is a single
   server-side operation** that creates the member record and marks the
   application approved together — it can't leave a half-approved state.
3. On approval the applicant gets a welcome email and can log in.

### Events flow
- Admins create events in the admin panel.
- Members (and pending applicants) register at `/events/[slug]`. Registration
  enforces capacity **atomically** — a full event can't be overfilled — and a
  member can't register twice (enforced by a database unique index).
- Events auto-archive ~4 hours after they end: they drop off the public events
  list but stay visible under "Archived" in the admin panel.
- People who signed up directly on PlayByPoint can be added manually as guests
  in the admin panel.

### Roles
- **Admins** are defined by email in `lib/admin-auth.js` (`ADMIN_EMAILS`).
  Admin actions are verified server-side with a signed token — see Security.
- **Members** are approved applicants; they access the member portal.

---

## Project Structure

```
app/
  api/                     # Backend API routes
    auth/login             # Login (issues admin token to admins)
    members, members/[id]  # Member CRUD (admin-guarded mutations)
    membership-applications# Applications + approve/deny
    events, events/[id]    # Event CRUD
    event-registrations    # Register / RSVP / capacity logic
    event-checkins         # Event day check-in
    sponsors, products     # Sponsor & product CRUD
    orders, newsletter     # Shop orders, newsletter signups
  events/[slug]            # Public event detail page
  portal-admin             # Admin control panel
  portal-*                 # Member portal (dashboard, leaderboard, stats, etc.)
  membership-apply         # Application form
  login, forgot-password, reset-password
  shop, product/[slug]     # Apparel storefront
lib/
  admin-auth.js            # Server-side admin token signing/verification
  auth.js                  # Client-side session helpers (localStorage)
  email.js                 # Shared email sender (Gmail SMTP, with retries)
  timezone.js              # All event times handled in America/Los_Angeles
  shopify*.js              # Shopify storefront integration
```

---

## Security Notes

- **Admin authorization is enforced on the server.** When an admin logs in,
  the server issues an HMAC-signed token (`lib/admin-auth.js`). Every
  admin-only API route calls `requireAdmin(request)` and rejects anything
  without a valid token. The browser cannot forge admin access.
- **Passwords** are hashed with salted PBKDF2 (never stored in plaintext).
- **Login** returns a uniform error for wrong email vs. wrong password to
  prevent account enumeration.
- **Public endpoints never return member email addresses** — only admins do.

---

## Deploying

Deploys are automatic: **push to `main` and Vercel builds and deploys it.**

```bash
git add .
git commit -m "describe your change"
git push origin main
```

Then watch the Vercel **Deployments** tab for a green "Ready". Always run
`npm run build` locally first to catch errors before pushing.

### Database migrations
Schema changes are applied by small one-off Node scripts (e.g. `migrate.js`)
that read `DATABASE_URL` from `.env.local` and run `ALTER TABLE` statements
directly against Neon. Run with `node <script>.js`.

---

## Known Follow-ups

- **Email:** currently sent from a personal Gmail account via Gmail SMTP.
  Moving to a verified domain sender (e.g. Resend) is the long-term fix.
  All email logic is centralized in `lib/email.js`, so switching providers
  only touches that file.
