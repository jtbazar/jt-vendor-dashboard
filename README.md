# JTBazar Vendor Center

A standalone JTBazar Vendor Center. The restaurant / kitchen workspace remains a UI prototype with local mock data; the `/marketplace` route now connects to the existing JTBazar Supabase backend for approved marketplace sellers.

## Run locally

```bash
pnpm install
pnpm dev
```

Open **http://localhost:3002**.

Production check:

```bash
pnpm typecheck
pnpm build
pnpm preview
```

## Pages

| Route | What it covers |
| --- | --- |
| `/vendor-login` | Existing customer email + password followed by six-digit email OTP, or Continue with Google for an existing Google-linked customer account |
| `/marketplace` | Approved-seller-only marketplace workspace: live listings, product gallery, variants, inventory, fulfilment, customer cases, support and shop profile |
| `/` | Redirects to `/marketplace`; no mock dashboard is shown before seller approval |
| `/orders` | Order queue — filters, search, order drawer, accepted → preparing → ready lifecycle and COD direction notes |
| `/kitchen` | Kitchen board — new / accepted / preparing / ready columns with prep timers and handover |
| `/menu` | Restaurant menu — portion sizes, paid add-ons, modifiers, per-item prep time, availability and margins |
| `/promotions` | Campaigns and coupons — percentage, fixed, BOGO, multi-buy, bundle and flash-sale flows with item targeting and eligibility |
| `/customers` | Customer directory — order-related details, lifetime spend, fulfilment preference, latest order and privacy note |
| `/reviews` | Reputation — rating breakdown, filters and public replies |
| `/inventory` | Ingredients — par levels, stock status and restock modal |
| `/earnings` | COD ledger — own-rider/pickup cash with vendor, JTBazar-rider payable, commission due and weekly manual settlements |
| `/analytics` | Revenue trend, peak hours, fulfilment mix and top items |
| `/support` | Ticket inbox and conversation thread with new-ticket flow |
| `/settings` | Business type and modules, shop profile, hours & delivery, Admin-approved drivers, payouts, notifications and team roles |

## Shared JTBazar marketplace integration

The `/marketplace` route is the first live-data integration slice for existing JTBazar marketplace sellers. It uses the shared production project only when the deployment environment is configured with the public publishable/anon key.

- `/vendor-login`: existing customer accounts only. Email/password users verify their password and then enter a six-digit email OTP; Google-linked users can use Continue with Google. No separate vendor registration is created.
- `/auth/callback`: completes Google OAuth on the Vendor Center origin using PKCE.
- `/marketplace`: approved seller gate, live listing data, product creation/editing, image gallery, variant images, inventory, paginated/searchable fulfilment orders, customer cases, deletion requests, support and shop profile information.
- Uses existing vendor RPCs and existing RLS-protected tables/storage. No schema migrations or database DDL are included.
- Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; see `.env.example`.
- Never put a service-role key in this frontend.

Seller applications remain on the existing customer website. The Vendor Center does not provide a second registration form. Restaurant-oriented routes are still prototypes and are not production-ready; they must be connected and tested before enabling them for restaurant vendors.

See [website vendor parity plan](docs/WEBSITE_VENDOR_PARITY.md) for the safety boundary and remaining parity work.

## Design system

- Forest `#243B2A` · cream `#F7F3E9` · sage `#7D9463` · clay `#C0714F`
- Poppins display headings, Inter body copy
- Shared primitives in `src/components/ui.tsx`, charts in `src/components/charts.tsx`
- Responsive from mobile (390px) to wide desktop; sidebar collapses to a drawer
- Command palette with `Ctrl/Cmd + K`

## PDF alignment

The prototype follows the restaurant vendor rules in
`JTBazar_Vendor_Restaurant_Phase_Wise_Plan_Roman_Urdu.pdf`:

- **Order lifecycle:** new → accepted → preparing → ready → completed / cancelled,
  with prep timers and a dedicated accepted column.
- **Menu:** sizes/variants, add-ons, modifiers and per-item prep time.
- **COD:** own-rider and pickup cash is collected by the vendor; JTBazar-rider cash
  is collected by the platform. Commission is calculated on the food subtotal only.
- **Settlements:** weekly manual settlement with COD offset, commission due, payment
  proof and Admin verification before an amount is marked paid.
- **Drivers:** only JTBazar Admin-approved drivers can be assigned; vendors cannot
  create driver accounts. A backup JTBazar rider can be requested.
- **Business type:** the Restaurant / Cafe module set is shown as Admin-controlled;
  the same Vendor Center shell can serve other business types.
- **Promotions:** item/category targeting, eligible-customer conditions, usage limits
  and flash sales with automatic start/end times.

## Notes

- Mock data lives in `src/data/mock.ts`; interactive state lives in `src/store.tsx`.
- Images are loaded from Unsplash and need an internet connection.
- Payout, commission, COD and settlement screens are illustrative and marked as a
  prototype; no real money movement or persistence is implemented.
- This project is a separate frontend, matching the plan's recommendation to keep the Customer website and Vendor Center separate.
- The marketplace route uses the existing JTBazar Supabase project and existing RLS/RPC surfaces; no migrations or schema changes are included in this repository work.
- Restaurant prototype routes still use mock data; they are not yet connected to real restaurant orders, menu, settlements or driver operations.
- No Android app or Admin dashboard is included in this repository.
