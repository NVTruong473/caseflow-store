# ADR-0006: Pivot v1.1 To CaseFlow Books

- Status: Accepted
- Date: 2026-07-16

## Context

`v1.0.0` shipped as CaseFlow Store, a phone-accessory e-commerce MVP with
Supabase persistence, protected admin order management, simulated checkout,
Playwright coverage, production deployment, and portfolio documentation.

The user has approved a post-MVP `v1.1` direction: evolve the project into
`CaseFlow Books`, a Vietnam-first bilingual bookstore that also demonstrates
small-business sales operations. This is a product pivot and scope expansion,
not a small feature addition.

The risk is overreach. A bookstore with real book data, bilingual content,
customer accounts, staff/admin roles, payment-method simulation, inventory,
promotions, analytics, and a rule-based assistant can easily become a broad
wishlist. The `v1.1` roadmap must prioritize realistic commerce behavior and
verified portfolio evidence over shallow feature count.

## Decision

Use `v1.1` to pivot the product identity from CaseFlow Store to CaseFlow Books.
The release remains a Next.js modular monolith on Supabase and Vercel unless a
later ADR identifies a real blocker.

The accepted `v1.1` direction is:

- Product identity: `CaseFlow Books`.
- Market focus: Vietnam-first bookstore; international sites are references,
  not the primary target.
- Language model: Vietnamese and English site modes, with all visible content
  controlled by the selected language.
- Catalog model: books, not phone accessories.
- Catalog target: about 100 sellable book editions, ideally representing
  English originals and Vietnamese translations where appropriate.
- Product model direction: separate book/work-level information from
  edition-level sellable inventory where the roadmap makes that practical.
- Pricing: VND is the source-of-truth currency.
- English-mode display: may show approximate USD conversion only with a source,
  timestamp, and configurable exchange-rate/fee assumptions.
- Tax/fee model: VAT and international payment or FX fees must be configurable
  estimates, not hard-coded legal claims.
- Checkout model: simulated checkout remains accepted, expanded to represent
  COD, bank transfer, MoMo, ZaloPay, and VNPay-style flows.
- Payment guardrail: do not collect card numbers, CVV, expiry, or real wallet
  credentials.
- Customer model: users may browse and add to cart freely, but checkout
  requires a customer account and required contact/shipping information.
- Verification model: email verification may use Supabase Auth; true phone
  verification requires a future provider decision and must not be claimed
  unless implemented and tested.
- Authorization model: support `admin`, staff/operator, and `customer` roles.
- Admin scope: move beyond order status updates toward product, category,
  stock, promotion, customer, order, sales, and inventory visibility.
- Assistant scope: add a rule-based bookstore assistant for purchase guidance
  and book discovery before considering AI integrations.

## Decisions Preserved

This ADR does not supersede:

- [ADR-0001](0001-use-nextjs-modular-monolith.md): keep the Next.js modular
  monolith.
- [ADR-0002](0002-use-supabase.md): keep Supabase for PostgreSQL and Auth.
- [ADR-0003](0003-use-mock-first-development.md): use validated domain data
  and mapping discipline before and during database changes.
- [ADR-0004](0004-use-local-cart.md): keep cart state local unless a later ADR
  accepts account-synced cart behavior.
- [ADR-0005](0005-use-simulated-checkout.md): continue simulated checkout
  unless a later ADR accepts a real payment provider.

## Alternatives Considered

1. Keep phone accessories and only polish the existing store.
   - Rejected because the user explicitly wants a richer bookstore direction
     with more diverse catalog and stronger management features.

2. Convert directly into a broad marketplace.
   - Rejected because multi-vendor commerce would add vendor onboarding,
     settlement, moderation, commissions, dispute handling, and a larger
     authorization model that does not fit the next 20-day update.

3. Add every requested feature without a domain pivot ADR.
   - Rejected because it would break the project discipline established by
     `v1.0.0` and make the roadmap hard to test.

4. Integrate real payments immediately.
   - Rejected for `v1.1` because real payments add legal, operational,
     provider, security, and testing complexity. Payment-like flows can be
     simulated first without collecting sensitive payment data.

## Consequences

Positive:

- The project gains a clearer `v1.1` identity and a more content-rich domain.
- A bookstore supports deeper catalog, search, language, edition, summary, and
  recommendation-style workflows than the original accessory MVP.
- Business-management features can demonstrate admin, staff, stock, promotion,
  customer, order, sales, and reporting workflows.
- Keeping the modular monolith avoids unnecessary infrastructure churn.

Negative:

- Existing product/domain code will need significant refactoring.
- Real book titles, covers, and descriptions introduce copyright and licensing
  risk.
- Mandatory account checkout can reduce conversion compared with guest
  checkout.
- Bilingual content doubles copy, validation, SEO, and QA work.
- Phone verification, live FX rates, and real payment providers are not free
  assumptions; each needs explicit implementation evidence.

## Guardrails

- Do not start runtime implementation until the Day 21-40 roadmap is written
  and accepted.
- Do not copy copyrighted book descriptions or cover images unless their use is
  licensed or otherwise clearly permitted.
- Prefer self-written summaries and legally safe placeholder/generated/internal
  cover assets when rights are unclear.
- Do not claim real payment success for simulated flows.
- Do not claim verified phone numbers without a real SMS/OTP or equivalent
  verification provider.
- Do not hard-code VAT, FX rates, or international payment fees as legal facts.
- Keep VND as the authoritative stored currency.
- Preserve server-side recalculation of price, subtotal, tax/fee estimates,
  shipping, and order totals.
- Keep authorization checks on the server/API, not only in UI navigation.
- Every Day 21-40 task must have acceptance criteria and meaningful
  verification.
