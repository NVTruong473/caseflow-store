# CaseFlow Books

CaseFlow Books is a deployed full-stack bookstore and small-business operations
demo. The project started as the 20-day CaseFlow Store `v1.0.0` MVP and was
upgraded through the Day 21-40 roadmap, the `v1.2` realistic catalog release,
the `v1.3` visual merchandising polish, the `v1.3.1` compact-card hotfix,
the `v1.4` real-commerce visual merchandising release, the `v1.5.0` QR
demo payment release, the `v1.6.0` retail catalog scale release, the
`v1.7.0` UI humanization release, the `v1.8.0` modern editorial bookstore
release, the `v1.9.0` real-cover commerce polish, the `v1.10.0`
account-bound signup voucher release, the `v1.11.x` account/security polish
series, the `v1.12.0` layered architecture hardening release, the
`v1.12.1` atomic order reliability patch, the `v1.13.0` transactional
notification release, the `v1.13.1` order-response reliability patch, and the
`v1.14.0` sellable-demo productization release into a Vietnam-first,
bilingual e-commerce application for book discovery,
account-gated checkout, customer order history/cancellation, order tracking,
and admin/staff operations. The latest release keeps the 500-edition catalog,
adds an account-scoped activity inbox and delivery outbox, and protects
simulated-transfer decisions behind staff/admin authorization.

[Open the production deployment](https://caseflow-store.vercel.app)

Latest release:
[`v1.14.0`](https://github.com/NVTruong473/caseflow-store/releases/tag/v1.14.0)

> Payments are simulated. The app does not collect card numbers, CVV, card
> expiry, real bank credentials, or real MoMo/ZaloPay/VNPay credentials. QR
> demo payment exists for development/sandbox verification and is locked from
> production settlement. Phone and email fields are validated for shape and
> checkout readiness. In-app transactional notifications are enabled. External
> email/SMS delivery and SMS OTP remain disabled until approved provider
> credentials and sender configuration are supplied.

## Screenshots

<table>
  <tr>
    <th>Storefront desktop</th>
    <th>Storefront mobile</th>
  </tr>
  <tr>
    <td width="70%"><img src="caseflow-store/docs/screenshots/storefront-desktop.png" alt="CaseFlow Books v1.2 homepage at 1440 pixels" /></td>
    <td width="30%"><img src="caseflow-store/docs/screenshots/storefront-mobile.png" alt="CaseFlow Books v1.2 homepage at 390 pixels" /></td>
  </tr>
  <tr>
    <th>Catalog desktop</th>
    <th>Catalog mobile</th>
  </tr>
  <tr>
    <td><img src="caseflow-store/docs/screenshots/catalog-desktop.png" alt="CaseFlow Books catalog filters and book grid at 1440 pixels" /></td>
    <td><img src="caseflow-store/docs/screenshots/catalog-mobile.png" alt="CaseFlow Books catalog filters and book grid at 390 pixels" /></td>
  </tr>
  <tr>
    <th>Book detail desktop</th>
    <th>Checkout mobile</th>
  </tr>
  <tr>
    <td><img src="caseflow-store/docs/screenshots/product-desktop.png" alt="CaseFlow Books book detail page at 1440 pixels" /></td>
    <td><img src="caseflow-store/docs/screenshots/checkout-mobile.png" alt="CaseFlow Books account-gated checkout on mobile" /></td>
  </tr>
  <tr>
    <th>Admin dashboard desktop</th>
    <th>Admin orders mobile</th>
  </tr>
  <tr>
    <td><img src="caseflow-store/docs/screenshots/admin-dashboard-desktop.png" alt="CaseFlow Books admin sales and inventory dashboard at 1440 pixels" /></td>
    <td><img src="caseflow-store/docs/screenshots/admin-orders-mobile.png" alt="CaseFlow Books admin order operations on mobile" /></td>
  </tr>
</table>

## Product scope

- Browse a seeded catalog of 500 sellable book editions across 50 works, with
  250 English and 250 Vietnamese products.
- Use reviewed local source-work covers where available plus project-created
  fallback covers with provenance and content-quality checks.
- Filter and sort by category, author, language, format, price, stock state,
  publication era, and search text.
- Compare English originals and Vietnamese editions where the dataset includes
  both.
- Switch between Vietnamese and English UI modes.
- Show VND as the authoritative currency and, in English mode, display
  approximate USD estimates using configurable VAT, FX, and payment-fee
  assumptions.
- Use a local cart that stores only edition IDs and quantities.
- Require customer login and a checkout-ready profile before order submission.
- Grant activated customer accounts 3 welcome voucher codes and enforce one
  owned code per order.
- Complete simulated COD, bank transfer, wallet/provider-style checkout flows,
  plus development-only QR demo payment verification.
- View customer order history, cancel eligible orders, and use guarded public
  order tracking.
- Receive account-scoped order activity in the in-app notification inbox.
- Use a rule-based bookstore assistant for finding books and buying guidance.

## Admin and operations scope

- Separate `admin`, `staff`, and `customer` roles.
- Admin/staff navigation for dashboard, orders, notifications, catalog,
  inventory, promotions, customers, and settings.
- Book catalog management with server-validated product/category data.
- Content-quality and merchandising operations for approved v1.2 shelves,
  source-review state, cover status, and bilingual reason-to-read copy.
- Inventory adjustment workflow with stock snapshots and operational notes.
- Promotion management for fixed-VND and percentage discounts.
- Customer management with minimized operational customer data.
- Order operations for order, payment, shipping status, internal notes, and
  staff/admin rejection or cancellation of risky orders.
- Protected simulated-transfer decisions and minimized notification delivery
  operations with admin-only provider readiness.
- Sales and inventory dashboard plus CSV export for operational reporting.

## Technical highlights

- Next.js App Router modular monolith with UI and Route Handlers in one Vercel
  deployment.
- Supabase PostgreSQL/Auth with RLS, SSR cookie sessions, and server-only
  service-role operations.
- Book domain modeled as categories, works, editions, authors, translators,
  publishers, cover assets, promotions, inventory adjustments, profiles,
  orders, order items, and QR payment sessions.
- Server reloads trusted book records and recalculates subtotal, promotion,
  VAT, shipping, payment fee, total values, and QR payment amounts.
- High-risk order creation now follows a Controller -> Use Case -> Repository
  boundary with an automated architecture verifier.
- Transactional outbox, customer inbox, server-rendered templates, optional
  external providers, idempotent dispatch, and hashed/rate-limited OTP
  challenges.
- Browser-supplied price, subtotal, stock, tax, fee, role, and order status are
  ignored.
- Zod validates mutating request bodies and public/admin APIs return stable
  `{ data, error, meta }` envelopes.
- Public SEO includes robots, sitemap, canonical metadata, and book JSON-LD for
  eligible book detail pages.
- Playwright covers storefront, checkout, account-gated flows, notification
  ownership, access control, admin operations, UI states, keyboard focus, and
  release edge cases.

## Data and content policy

- The catalog uses factual classic/public-domain-style book metadata where
  practical.
- Self-written summaries and merchandising copy are created inside the project
  instead of copied from publisher blurbs or reviews.
- The active catalog uses reviewed local source-work covers where practical and
  project-created fallback covers. The generic placeholder remains only as a
  fallback/admin quality state.
- Source and rights assumptions are documented in
  [`caseflow-store/docs/v1.2-cover-portfolio.md`](caseflow-store/docs/v1.2-cover-portfolio.md),
  [`caseflow-store/docs/v1.2-provenance-content-quality-contracts.md`](caseflow-store/docs/v1.2-provenance-content-quality-contracts.md),
  and [`caseflow-store/docs/domain.md`](caseflow-store/docs/domain.md).

## Verified latest release

| Gate | Result |
|---|---|
| Release tag | `v1.14.0` |
| GitHub Release | [`v1.14.0 - Sellable Demo Productization`](https://github.com/NVTruong473/caseflow-store/releases/tag/v1.14.0) |
| Production URL | `https://caseflow-store.vercel.app` |
| Vercel deployment | `READY`, deployment `dpl_6cLwah2gUno1dbar97VQKFSopirM` |
| TypeScript | `npx tsc --noEmit --pretty false` passed |
| ESLint | `npm run lint` passed |
| Production build | 59 App Router routes plus proxy generated |
| Architecture boundary | `npm run verify:architecture` passed; `POST /api/orders` delegates to `createBookOrderUseCase` |
| Signup voucher QA | 3 account codes granted, homepage/account CTAs visible, checkout applies `WELCOME30K`, persisted 30,000 VND discount, reuse rejected, cross-account use rejected, multi-code request rejected, used voucher relation verified |
| Modern bookstore QA | Search-first header, live category menu, mobile search/category links, cover provenance manifest, object-contain covers, product-card motion, back-to-top, no-overflow screenshots, and reduced-motion guard passed |
| QR demo payment QA | Local QR flow, VietQR CRC, mock webhook HMAC, idempotency, production-safety lock, and UI regression checks passed |
| Notification QA | Provider/OTP contracts, account ownership, minimized staff/admin operations, 8/8 anonymous boundaries, migration lifecycle, and disabled external-delivery controls passed |
| Productization QA | Shared store configuration, zero invented contacts, zero runtime source brand-coupling findings, buyer override, catalog handoff, and commercial/provider boundary gates passed |
| Production QA | v1.14.0 smoke, security posture, QR production-safety lock, notification boundary, catalog filters, SEO, storefront/accessibility/final QA, cleanup, and full Production Playwright `24/24` passed |
| v1.4.2 security QA | Security headers/no-store verifier and final QA smoke passed locally and in production; external agent repos were mapped as QA references, not runtime dependencies |
| v1.4.1 local QA | TypeScript, lint, production build, no-demo copy scan, compact-card overlap, customer order history/cancellation, admin order rejection/cancellation, cleanup, secret scan, audit-high, and `git diff --check` passed |
| v1.4.1 production QA | Production release smoke, final QA smoke, compact-card overlap, customer order history/cancellation, and admin order rejection/cancellation passed |
| v1.4 production QA | Production release smoke passed with 100 active editions, 100 cover responses, public/customer/admin boundaries, assistant, language mode, and representative detail pages |
| v1.3.1 hotfix QA | Local and production compact-card overlap verifier passed across mobile, tablet, and desktop; affected homepage/detail visual verifiers passed before `v1.4` |
| Production smoke | Home, catalog, English/Vietnamese detail, 100-cover catalog, language mode, cart/checkout boundary, customer/admin boundaries, assistant, robots, and sitemap passed |
| Catalog quality | 500 active editions, 250 English, 250 Vietnamese, zero primary placeholder covers in checked public catalog payload |
| Secret scan | Clean |
| Cleanup check | Zero stale test/QA matches |

Release evidence is recorded in
[`caseflow-store/docs/release-candidate.md`](caseflow-store/docs/release-candidate.md),
[`caseflow-store/docs/v1.2-release-audit.md`](caseflow-store/docs/v1.2-release-audit.md),
[`caseflow-store/docs/v1.3-final-post-release-qa-audit.md`](caseflow-store/docs/v1.3-final-post-release-qa-audit.md),
[`caseflow-store/docs/v1.3.1-compact-card-layout-hotfix-release-notes.md`](caseflow-store/docs/v1.3.1-compact-card-layout-hotfix-release-notes.md),
[`caseflow-store/docs/v1.4.1-stable-closeout-patch-release-notes.md`](caseflow-store/docs/v1.4.1-stable-closeout-patch-release-notes.md),
[`caseflow-store/docs/v1.4.2-agent-security-qa-report.md`](caseflow-store/docs/v1.4.2-agent-security-qa-report.md),
[`caseflow-store/docs/v1.5.0-qr-demo-payment-release-notes.md`](caseflow-store/docs/v1.5.0-qr-demo-payment-release-notes.md),
[`caseflow-store/docs/v1.6.0-retail-catalog-scale-release-notes.md`](caseflow-store/docs/v1.6.0-retail-catalog-scale-release-notes.md),
[`caseflow-store/docs/v1.7.0-ui-humanization-release-notes.md`](caseflow-store/docs/v1.7.0-ui-humanization-release-notes.md),
[`caseflow-store/docs/v1.8.0-modern-editorial-bookstore-release-notes.md`](caseflow-store/docs/v1.8.0-modern-editorial-bookstore-release-notes.md),
[`caseflow-store/docs/v1.9.0-real-cover-commerce-polish-release-notes.md`](caseflow-store/docs/v1.9.0-real-cover-commerce-polish-release-notes.md),
[`caseflow-store/docs/v1.10.0-account-bound-signup-voucher-release-notes.md`](caseflow-store/docs/v1.10.0-account-bound-signup-voucher-release-notes.md),
[`caseflow-store/docs/v1.12.0-layered-architecture-release-notes.md`](caseflow-store/docs/v1.12.0-layered-architecture-release-notes.md),
[`caseflow-store/docs/v1.12.1-order-reliability-release-notes.md`](caseflow-store/docs/v1.12.1-order-reliability-release-notes.md),
[`caseflow-store/docs/v1.13.1-order-response-reliability-patch-release-notes.md`](caseflow-store/docs/v1.13.1-order-response-reliability-patch-release-notes.md),
[`caseflow-store/docs/v1.14.0-sellable-demo-productization-release-notes.md`](caseflow-store/docs/v1.14.0-sellable-demo-productization-release-notes.md),
[`caseflow-store/docs/postv130-t01-final-release-consistency-audit.md`](caseflow-store/docs/postv130-t01-final-release-consistency-audit.md),
[`caseflow-store/docs/uat-owner-t01-production-acceptance.md`](caseflow-store/docs/uat-owner-t01-production-acceptance.md),
[`caseflow-store/docs/postv121-t01-final-release-consistency-audit.md`](caseflow-store/docs/postv121-t01-final-release-consistency-audit.md),
[`caseflow-store/docs/postv120-t01-final-release-consistency-audit.md`](caseflow-store/docs/postv120-t01-final-release-consistency-audit.md),
and `.agent/step-results.md`.

## Portfolio handoff

- Project handoff packet:
  [`caseflow-store/docs/portfolio-handoff.md`](caseflow-store/docs/portfolio-handoff.md)
- Evidence-backed CV bullets:
  [`caseflow-store/docs/cv-bullets.md`](caseflow-store/docs/cv-bullets.md)
- Architecture summary:
  [`caseflow-store/docs/architecture.md`](caseflow-store/docs/architecture.md)
- Known boundaries:
  [`caseflow-store/docs/known-limitations.md`](caseflow-store/docs/known-limitations.md)

## Stack

- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4
- Supabase PostgreSQL, Auth, SSR client, and RLS
- Zod 4
- Playwright 1.61
- Vercel

## Repository structure

```text
.
├── caseflow-store/           # Next.js application package
│   ├── src/app/              # Pages and Route Handlers
│   ├── src/features/         # Storefront, customer, assistant, and admin UI
│   ├── src/lib/              # Domain, validation, repositories, auth, SEO
│   ├── supabase/             # Base schema plus v1.1/v1.2 migrations
│   ├── tests/e2e/            # Playwright release suite
│   └── docs/                 # Architecture, ADRs, release evidence
├── docs/                     # Mirrored project-level documentation
└── .agent/                   # Roadmap, context, and verified task results
```

## Local setup

Prerequisites: Node.js 20 or newer, npm, and a configured Supabase project.

```bash
cd caseflow-store
npm install
cp .env.example .env.local
```

1. Apply the base schema and the `supabase/migrations/` files to Supabase.
2. Seed the CaseFlow Books data with the project seed scripts/data.
3. Fill the required runtime variables in `.env.local`.
4. Create admin/staff/customer Supabase Auth users as needed for local testing.
5. Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Runtime | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Public RLS-scoped key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Trusted order/admin operations |
| `NEXT_PUBLIC_SITE_URL` | Browser and server | Canonical URL for metadata, robots, and sitemap |
| `PAYMENT_MODE` | Server only | `demo` for local QR sandbox or `disabled`; QR demo remains locked in production |
| `ENABLE_MOCK_PAYMENT` | Server only | Enables local simulate-success endpoint outside production |
| `CASEFLOW_MERCHANT_NAME` | Server only | Merchant/store display name for demo payment sessions |
| `DEMO_BANK_BIN` | Server only | Demo VietQR bank BIN |
| `DEMO_BANK_NAME` | Server only | Demo bank display name |
| `DEMO_BANK_ACCOUNT_NUMBER` | Server only | Demo account number, default `0000000000` |
| `DEMO_BANK_ACCOUNT_NAME` | Server only | Optional demo account name; defaults to merchant name plus `DEMO` |
| `DEMO_PAYMENT_EXPIRES_MINUTES` | Server only | Demo payment expiry window |
| `MOCK_PAYMENT_WEBHOOK_SECRET` | Server only | Local HMAC secret for mock webhook simulation |
| `CASEFLOW_ADMIN_EMAIL` | Playwright only | Admin release-test identity |
| `CASEFLOW_ADMIN_PASSWORD` | Playwright only | Admin release-test password |
| `CASEFLOW_CUSTOMER_EMAIL` | Playwright only | Customer release-test identity |
| `CASEFLOW_CUSTOMER_PASSWORD` | Playwright only | Customer release-test password |

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_*` variable or a
Client Component. Playwright credentials are not deployed to Vercel.

## Commands

```bash
npm run dev       # development server
npm run lint      # ESLint
npm run build     # production build and TypeScript validation
npm run start     # serve the production build
npm run test:e2e  # Playwright suite; requires test environment variables
```

To run Playwright against an existing deployment:

```bash
PLAYWRIGHT_BASE_URL=https://caseflow-store.vercel.app npm run test:e2e
```

## Design decisions

The decisions behind the modular monolith, Supabase, mock-first delivery, local
cart, simulated checkout, and CaseFlow Books pivot are documented in
[`caseflow-store/docs/adr/`](caseflow-store/docs/adr/). Current boundaries and
accepted risks are listed in
[`caseflow-store/docs/known-limitations.md`](caseflow-store/docs/known-limitations.md).
Evidence-backed portfolio bullets are available in
[`caseflow-store/docs/cv-bullets.md`](caseflow-store/docs/cv-bullets.md).
