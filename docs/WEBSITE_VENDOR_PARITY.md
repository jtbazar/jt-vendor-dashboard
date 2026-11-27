# JTBazar Vendor Center — Website parity work

## Safety boundary
- Work is isolated on `feature/vendor-dashboard-parity`.
- No Supabase migrations, DDL, table changes, policy changes, RPC changes, or production data edits are part of this branch.
- The frontend uses the existing JTBazar Supabase project with a publishable/anon key only.
- Vendor actions call existing, role-checked RPCs and existing RLS-protected tables. Those actions only take effect when an approved vendor uses the UI.
- Do not deploy or merge to `main` without owner approval.

## Existing website capabilities to bring across
- Seller account gate and application/approval state.
- Product listings, moderation status, visibility, category, price and product metadata.
- Product images and variants.
- Inventory quantities, low-stock thresholds and stock adjustment history.
- Vendor order items, fulfilment status and pickup status.
- Customer marketplace cases and seller responses.
- Shop profile, business type, contact details, location and hours.
- Vendor support tickets and messages.
- Commission preview and earnings/settlement information.
- Restaurant-specific menu, kitchen queue, promotions, customer reviews and analytics already represented in the standalone prototype.

## Implementation status

- [x] Isolated work on a feature branch.
- [x] Added Vendor Center Supabase client configuration with a dedicated auth storage key.
- [x] Added password verification followed by six-digit email OTP sign-in.
- [x] Added approved-seller status gate.
- [x] Added live product listing, inventory, vendor order, and customer case reads.
- [x] Added existing-RPC actions for product visibility, stock changes, and marking orders ready.
- [x] Added product creation, product-image upload, and existing submission-finalization RPC flow.
- [x] Added GitHub Actions typecheck/build validation.
- [ ] Complete parity for product editing, variants, shop profile editing, support tickets, and all restaurant modules.
- [ ] Validate against a dedicated staging account and run end-to-end regression tests.
- [ ] Obtain owner approval before any production deployment.

## First integration slice
The initial marketplace integration adds the existing password-then-email-OTP sign-in flow, seller profile gate, and read/action views for listings, inventory, fulfilment and cases. It uses existing functions such as `vendor_list_products`, `vendor_order_items_page_v2`, `vendor_list_order_pickup_statuses`, `vendor_set_product_visibility`, `vendor_set_product_inventory`, and `vendor_mark_order_ready`.

## Required environment
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (or legacy `VITE_SUPABASE_ANON_KEY`)

Never add a service-role key to this frontend.
