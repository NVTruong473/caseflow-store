# ADR-0009: Real Commerce And Visual Merchandising Upgrade For v1.4

- Status: Accepted
- Date: 2026-07-19
- Planning task: `V14-T01 - Real Commerce + Visual Merchandising ADR`

## Context

CaseFlow Books `v1.3.1` is released, deployed, smoke tested, and closed out as
a portfolio-ready bookstore. It has a 100-edition catalog, bilingual
storefront, account-gated checkout, customer order flows, staff/admin
operations, rule-based assistant, SEO, production evidence, and a verified
compact-card layout hotfix.

The user now wants the public web experience to feel less like a portfolio demo
and more like a small bookstore that is actually operating online. They also
reported a visual weakness: many tabs, shelves, cards, and smaller pages still
reuse the same bordered-card rhythm, making the bookstore feel too uniform even
after the `v1.3` polish phase.

The gap is therefore two-sided:

- Commercial reality: runtime copy still contains some internal honesty terms
  that are useful for portfolio documentation but weaken a customer-facing shop
  experience, such as explicit references to fake signals, no payment
  collection, API implementation, and display-only fees.
- Visual merchandising depth: storefront shelves, catalog cards, detail
  recommendations, assistant/account/checkout panels, and admin surfaces need
  more structural variety, not just recolored versions of the same card.

The risk is overcorrection. A web shop does not become real by pretending to
process payments, copying commercial covers, inventing ratings, or adding
decorative color. It becomes credible when the buying surfaces, content,
policies, operations, and visual system tell a coherent, truthful commerce
story.

## Decision

Use `v1.4` for a bounded **Real Commerce & Visual Merchandising Upgrade**. The
phase will make the runtime UI read like a customer-facing bookstore and make
the visual system more varied through a merchandising-layout library.

This phase is approved for direct implementation after the roadmap is created,
one task ID at a time, with verification before moving to the next task.

## Scope

Allowed:

- remove demo/internal/portfolio-style wording from runtime UI and replace it
  with commercial bookstore language;
- keep portfolio and limitation honesty in README/docs, not in customer-facing
  runtime copy;
- add a runtime no-demo-copy verification script;
- expand design tokens with commerce roles such as editorial, discovery,
  translation, academic, offer, trust, and operations;
- add structurally distinct merchandising components for editorial features,
  book-pair comparison, deal strips, reading paths, category spines, and author
  or language shelves;
- improve homepage, catalog, product detail, checkout, account, order tracking,
  assistant, footer, and admin surfaces using existing data and routes;
- add customer-facing trust pages for shipping, payment, returns, privacy,
  terms, and bookstore contact information;
- improve admin visual hierarchy and operational framing without changing the
  authorization model or database schema;
- add visual QA scripts and screenshots for mobile and desktop viewports.

Not allowed under this ADR:

- real payment-provider integration without a separate payment ADR, webhook
  plan, idempotency plan, reconciliation rules, and rollback procedure;
- real SMS/OTP, email verification provider, shipping-carrier API, or external
  AI service integration;
- database schema changes, production data migration, dependency additions, or
  deployment/tag/release changes unless a specific V14 task explicitly requires
  them;
- fake ratings, fake sold counts, bestseller labels without first-party order
  evidence, fake reviews, fabricated customer testimonials, or fake market
  price claims;
- copying commercial book covers, protected publisher blurbs, protected
  excerpts, marketplace images, or third-party product media without a recorded
  rights basis;
- turning the bookstore into a decorative landing page that weakens catalog
  discovery, checkout clarity, or admin usability;
- changing the stable public/admin API error contract or weakening server-side
  role, price, stock, promotion, tax, fee, shipping, or total validation.

## Commercial Runtime Language Policy

Public runtime UI must avoid terms that reveal build mechanics or portfolio
framing:

- demo, mock, fake, dummy, sample app, portfolio;
- no payment collected, display-only, represented without collecting;
- not an AI API, rule-based as a disclaimer, internal placeholder, test data;
- "not fake" explanations that mention unsupported features rather than simply
  presenting truthful editorial labels.

Equivalent commercial copy is allowed:

- "Thanh toan khi nhan hang" / "Cash on delivery";
- "Chuyen khoan theo huong dan don hang" / "Bank transfer instructions";
- "Uoc tinh quy doi" / "Estimated conversion";
- "Tu sach bien tap chon" / "Editor-selected shelf";
- "Bia minh hoa CaseFlow" / "CaseFlow cover art" only where legally necessary
  and not as a primary selling claim.

Documentation may continue to explain the project boundaries honestly. The
runtime storefront should communicate customer-facing policies instead of
implementation caveats.

## Visual Merchandising Direction

The v1.4 visual system must add structural variety rather than recolor the same
component.

Required merchandising shapes:

- editorial feature shelf: one dominant book plus supporting titles;
- translation pair comparison: English and Vietnamese editions as a deliberate
  buying choice;
- deal strip: offer-led but without fake urgency;
- category spine rail: category browsing that feels bookstore-specific;
- reading path: guide a reader through a theme or intent;
- language shelf: English originals and Vietnamese translations use distinct
  identity, not just a badge;
- operations panel: admin/customer service surfaces use dense operational
  rhythm, not storefront cards.

Color roles must be token-backed, not random one-off Tailwind values. The
palette should remain readable and commerce-focused: warm paper/ink foundations,
moss discovery, wine editorial, amber offers, navy/graphite operations, and
controlled accent variation for translation, academic, and trust surfaces.

## Acceptance Criteria

`v1.4` can be considered release-ready only if:

- runtime customer-facing UI no longer contains prohibited demo/internal copy;
- portfolio limitations remain documented in README/docs;
- home, catalog, product detail, checkout, account/tracking, assistant, footer,
  and admin surfaces have more than one structural visual pattern;
- product card variants differ by layout and information hierarchy, not only by
  color;
- homepage shelves include at least four distinct merchandising layouts;
- catalog discovery includes better quick entry points and active filter
  scanning;
- product detail shows stronger commercial trust and recommendation layout;
- checkout copy presents real-world payment/shipping expectations without
  pretending to process external provider credentials;
- admin pages look like operating surfaces for orders, inventory, content, and
  customers, while preserving access controls;
- no fake reviews, ratings, sold counts, commercial covers, or external
  marketplace claims are introduced;
- TypeScript, ESLint, production build, no-demo-copy scan, visual QA, and
  affected Playwright checks pass.

## Alternatives Considered

### Only Recolor Existing Cards

Rejected. It would make the app look different in screenshots but preserve the
same monotonous rhythm the user correctly identified.

### Add Marketplace-Style Proof Signals

Rejected. Ratings, sold counts, bestseller tags, and urgency banners would make
the site look more familiar but less honest without first-party data and
moderation.

### Integrate Real Payments Immediately

Rejected for this ADR. Real payments require provider selection, webhook
handling, idempotency, reconciliation, refund behavior, security review, and
production incident handling. UI language can be made commercial, but actual
payment processing needs a separate decision.

### Use Commercial Book Covers From Retailers

Rejected. Commercial covers would improve realism quickly but introduce
copyright, attribution, takedown, and portfolio-integrity risk.

## Consequences

Positive:

- the public site will feel more like an operating bookstore and less like a
  portfolio artifact;
- visual variety will come from merchandising strategy, not arbitrary color;
- runtime copy will become cleaner for real shoppers while docs stay honest for
  recruiters and maintainers;
- the project will better demonstrate product design judgment, content
  discipline, QA, and full-stack commerce boundaries.

Negative:

- visual changes increase regression risk across responsive layouts;
- no-demo runtime wording may reduce visible honesty unless documentation stays
  current;
- customer trust pages need careful wording because the business does not yet
  have real payment, tax, shipping-carrier, or legal-provider integrations;
- a full commercial launch still requires separate legal, payment, tax, and
  operations work outside this ADR.

## Guardrails

- Work one `V14-*` task at a time.
- Verify each task before moving to the next.
- Do not deploy, tag, or create a GitHub Release unless a later task explicitly
  asks for it.
- Do not mutate production data unless a specific approved task includes a
  migration plan and rollback plan.
- Keep VND authoritative and keep server-owned commerce calculations unchanged.
- Keep Supabase Auth/RLS and server-side admin/staff role checks unchanged.
- Preserve the public API error contract unless a release-blocking defect is
  documented separately.
- Keep the project history honest: this is a post-`v1.3.1` improvement phase,
  not more implementation days added to the original 40-day story.
