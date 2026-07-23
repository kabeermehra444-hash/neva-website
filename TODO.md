# TODO / Known Follow-ups

Living list of what's left. Update it as things get done or added. Keep it
honest — it's more useful as a real backlog than an aspirational one.

---

## High priority (needed before real scale / public growth)

- [ ] **Move email off personal Gmail.** Gmail SMTP has a ~500 email/day limit
      and risks account suspension if used for mass sends. Verify with a real
      provider (Resend/SendGrid) and update `lib/email.js` (only that file
      needs to change).
- [ ] **Build a bulk "weekly update" broadcast system.** Sending updates to all
      members needs: batching, an unsubscribe link (legally required for bulk
      email), and a provider that can handle the volume. This does not exist
      yet — only per-event notifications do.

## Medium priority

- [ ] **Caching strategy** for public data (events list, leaderboard). Minor
      now; matters more at higher traffic. Currently no explicit caching.
- [ ] **Second-admin onboarding note:** Eva must log out/in once to get her
      admin token after the auth system went live.

## Low priority / nice to have

- [ ] Accessibility polish: connect form labels to inputs, visible keyboard
      focus states, aria-labels on icon-only buttons, a "skip to content" link.
      (Not urgent; some legal relevance for a CA business long-term.)
- [ ] Automated tests. Fine to skip at current size; revisit if the codebase
      grows a lot.
- [ ] Retire or fix the 3 orphaned hardcoded event pages
      (`event-challenger-series`, `event-all-levels-mixer`,
      `event-elite-round-robin`) — nothing links to them and they use outdated
      auth keys.

## Done (moved from this list — see CHANGELOG.md)

Security hardening, atomic approval, capacity enforcement, duplicate
prevention, timezone fixes, mobile layout, link previews, email retries,
custom domain (clubneva.com) live and wired throughout.
