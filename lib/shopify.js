// ─── Shopify Integration (future) ───────────────────────────────────────────
//
// TODO: When Shopify is connected, NEVA Cash should be applied as a one-time
// Shopify discount code rather than handled on this checkout page.
//
// Implementation plan:
//   1. On "Checkout" click, call Shopify Admin API:
//        POST /admin/api/2024-01/price_rules.json  →  create a fixed-amount price rule
//        POST /admin/api/2024-01/price_rules/{id}/discount_codes.json  →  generate a code
//   2. Cap the discount at min(member.neva_cash_balance, order subtotal).
//   3. Pre-fill the generated code in the Shopify checkout URL:
//        https://{shop}.myshopify.com/cart/{variant_id}:{qty}?discount={code}
//   4. After the Shopify order webhook confirms payment, deduct the redeemed
//      amount from the member's neva_cash_balance via PATCH /api/members/{id}.
//   5. Mark the discount code as used so it can't be reused.
//
// Required env vars (add to .env when ready):
//   SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
//   SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxxxx
//   SHOPIFY_STOREFRONT_TOKEN=xxxxxxxxxxxxxxxx  (for Buy Button SDK)
//
// See: https://shopify.dev/docs/api/admin-rest/price-rules
// ─────────────────────────────────────────────────────────────────────────────
