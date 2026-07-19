# Architecture Decision Records

This index lists the accepted architecture decisions for CaseFlow Books and the
verified implementation outcome of each decision.

| ADR | Status | Decision | Outcome or governing scope |
|---|---|---|---|
| [ADR-0001](0001-use-nextjs-modular-monolith.md) | Accepted | Use a Next.js modular monolith | Storefront, customer account flows, admin/staff operations, assistant, SEO routes, and Route Handlers deploy as one Vercel application. |
| [ADR-0002](0002-use-supabase.md) | Accepted | Use Supabase for PostgreSQL and Auth | Supabase stores the book catalog, profiles, orders, promotions, inventory adjustments, and role-backed sessions under RLS with server-only service-role operations. |
| [ADR-0003](0003-use-mock-first-development.md) | Accepted | Build domain and UI against mock repositories first | The production runtime uses Supabase repositories through validated row mappers; mock modules remain as development history and fixtures. |
| [ADR-0004](0004-use-local-cart.md) | Accepted | Store the cart in React Context and localStorage | The cart stores only book edition IDs and quantities locally; account-gated checkout revalidates trusted edition, stock, promotion, tax, fee, and total data server-side. |
| [ADR-0005](0005-use-simulated-checkout.md) | Accepted | Simulate checkout without collecting card data | Production creates database orders with simulated COD, bank transfer, MoMo, ZaloPay, and VNPay-style states, but processes no real payment and renders no card/e-wallet credential fields. |
| [ADR-0006](0006-pivot-to-caseflow-books.md) | Accepted | Pivot `v1.1` to CaseFlow Books | Implemented as a Vietnam-first bilingual bookstore with 100 editions, account-gated checkout, customer tracking, admin/staff operations, rule-based assistant, SEO, and documented content/payment limits. |
| [ADR-0007](0007-realistic-bookstore-content-merchandising-upgrade.md) | Accepted | Use a provenance-first content and merchandising upgrade for `v1.2` | Released as `v1.2.0` with a 100-edition catalog, 100 project-created covers, truthful merchandising shelves, content-quality gates, and bounded storefront/admin polish. |
| [ADR-0008](0008-visual-merchandising-brand-polish.md) | Accepted | Use a bounded visual merchandising and brand polish phase for `v1.3` | Governs post-`v1.2.0` visual polish: richer bookstore tokens, cover-led merchandising, Hallmark-informed audit discipline, and no new commerce/integration scope. |
| [ADR-0009](0009-real-commerce-visual-merchandising-upgrade.md) | Accepted | Use a bounded real-commerce language and visual merchandising upgrade for `v1.4` | Governs post-`v1.3.1` runtime commercial-copy cleanup, structurally varied merchandising layouts, trust/policy surfaces, and operations polish without fake proof signals or new external integrations. |
| [ADR-0010](0010-qr-demo-payment-provider-boundary.md) | Accepted | Add a production-locked QR demo payment provider boundary | Governs post-`v1.4.2` QR payment sessions, demo VietQR/mock-gateway providers, webhook/idempotency handling, and production mock-payment lockout without approving real payment collection. |

## Status meanings

- **Proposed**: under review and not approved for implementation.
- **Accepted**: approved and currently governs the project.
- **Superseded**: replaced by a newer ADR.
- **Rejected**: considered but not adopted.

## Adding a decision

Create the next numbered Markdown file when a change affects a major boundary,
data model, authentication/authorization model, external service, deployment
model, or established release constraint. Include context, decision,
alternatives, consequences, and guardrails, then add it to this index.
