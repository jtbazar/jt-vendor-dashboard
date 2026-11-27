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
- [x] Added existing-customer password verification followed by six-digit email OTP sign-in.
- [x] Added existing Google-linked customer sign-in with email lookup, PKCE OAuth callback and email identity matching.
- [x] Added a 60-second resend cooldown for email OTP.
- [x] Protected Vendor Center routes so only approved sellers can see the workspace; non-approved accounts see their application status instead.
- [x] Kept seller registration/application on the customer website; no second vendor registration is introduced.
- [x] Added approved-seller status gate.
- [x] Added live product listing, inventory, vendor order, and customer case reads.
- [x] Added existing-RPC actions for product visibility, stock changes, and marking orders ready.
- [x] Added product creation, compressed product-image upload, existing submission-finalization RPC flow, variant management and variant image uploads.
- [x] Added product image gallery and optimized multi-image upload using the existing seller INSERT policy; no unsupported image UPDATE/DELETE permission is assumed.
- [x] Added seller product-removal requests through the existing deletion RPC.
- [x] Added order search, website-aligned delivery-status filters and pagination.
- [x] Added case evidence links through short-lived private storage URLs.
- [x] Added inventory adjustments through the existing history-recording vendor RPC.
- [x] Added category commission preview and food-category selling units / daily availability.
- [x] Added seller shop hours, location/map visibility, shop image and private verification document management.
- [x] Added GitHub Actions typecheck/build validation.
- [x] Added existing-RPC product variant management.
- [x] Added support ticket inbox, message thread and ticket creation using existing support tables.
- [x] Added shop profile editing through the existing seller profile RLS policy, including account email, location, map visibility and shop hours.
- [x] Added existing-RPC product editing for customer-facing fields, costs, discounts, dimensions, specifications, SEO and food-specific fields.
- [x] Finish seller listing metadata and food-specific product fields in the UI.
- [x] Match existing website inventory adjustment workflow and order search/status/pagination.
- [ ] Add any additional order fields only if the existing website/vendor RPC exposes them; customer delivery/contact details remain marketplace-managed.
- [x] Complete website-supported shop settings parity: hours, map/location visibility, shop image and private business/CNIC document replacement.
- [ ] Add secure settlement details only if an existing vendor-authorized backend surface is verified.
- [ ] Finish earnings, commission, settlement, analytics and all restaurant modules against verified existing backend surfaces.
- [x] Keep mock restaurant / kitchen routes out of the live router so vendors cannot mistake prototype balances or orders for real data.
- [ ] Validate against a dedicated staging account and run end-to-end regression tests.
- [ ] Obtain owner approval before any production deployment.

## First integration slice
The Vendor Center authenticates existing JTBazar customer identities only. Email/password accounts use password verification followed by email OTP; Google-linked accounts use an existing-account email lookup and PKCE OAuth callback. Both methods resolve the same auth user ID and then check the existing seller profile. Only `status = approved` and an unlocked seller profile render the Vendor Center workspace. Seller application and approval remain on the customer website. It uses existing functions such as `vendor_list_products`, `vendor_order_items_page_v2`, `vendor_list_order_pickup_statuses`, `vendor_set_product_visibility`, `vendor_set_product_inventory`, and `vendor_mark_order_ready`.

## Required environment
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (or legacy `VITE_SUPABASE_ANON_KEY`)

Never add a service-role key to this frontend.

For Google OAuth deployment, add the final Vendor Center subdomain callback URL (`https://<vendor-subdomain>/auth/callback`) to the existing Supabase Auth redirect allow-list when the owner approves domain setup. This is a configuration step, not a database migration; it has not been changed here.

The customer website repository and production deployment have not been modified.
