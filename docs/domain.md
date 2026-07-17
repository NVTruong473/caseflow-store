# CaseFlow Books - Domain And Content Policy

## Status

- Task: `D22-T01 - Create Book Domain And Content Policy`
- Date: 2026-07-16
- Status: accepted for `v1.1` planning and implementation
- Governing ADR: `docs/adr/0006-pivot-to-caseflow-books.md`
- Roadmap: `docs/v1.1-caseflow-books-roadmap.md`

`v1.0.0` shipped as CaseFlow Store for phone accessories. `v1.1` pivots the
active product domain to CaseFlow Books: a Vietnam-first bilingual bookstore
with practical small-business operations.

This document is the source of truth for book-domain modeling and content-use
rules before TypeScript types, Zod schemas, database migrations, seed data, UI,
and admin workflows are changed.

## Product Positioning

CaseFlow Books is a focused online bookstore, not a marketplace.

Primary goals:

- Help Vietnamese customers discover and buy books with clear guidance.
- Support both Vietnamese and English site modes.
- Sell English originals and Vietnamese translated editions where practical.
- Demonstrate realistic bookstore operations for a small business.
- Preserve portfolio-grade engineering evidence: validation, roles, inventory,
  checkout, admin workflows, tests, deployment, and honest limitations.

Non-goals for `v1.1`:

- Real payment processing.
- Multi-vendor selling.
- Real shipping-carrier integration.
- Real SMS/OTP phone verification.
- AI chatbot integration.
- Copying commercial book covers or descriptions without permission.

## Audience And Market

Primary audience:

- Vietnam-based readers buying online in VND.
- Readers who prefer Vietnamese UI and Vietnamese-translated editions.
- Readers who want the English original where available.

Secondary audience:

- English-speaking users browsing a Vietnam-based bookstore.
- Recruiters or interviewers reviewing the project as a full-stack portfolio
  artifact.

Market assumptions:

- VND is the source-of-truth currency.
- English mode may display approximate USD for convenience, but not as the
  stored or authoritative order currency.
- VAT, FX conversion, and international payment fees are configurable estimates,
  not legal or tax claims.
- COD, bank transfer, MoMo, ZaloPay, and VNPay-style flows are simulated unless
  a later ADR approves real providers.

## Core Domain Concepts

### Book Work

A book work represents the intellectual work independent of the sellable
edition.

Example:

- Work: `Norwegian Wood`
- Original author: `Haruki Murakami`
- Original language: Japanese
- Sellable editions: English paperback, Vietnamese translation paperback

Fields to consider for `D22-T02`:

- `id`
- `slug`
- `title`
- `originalTitle`
- `primaryAuthorIds`
- `originalLanguage`
- `categoryIds`
- `themes`
- `ageRating`
- `publicationEra`
- `canonicalSummary`
- `isActive`
- `createdAt`
- `updatedAt`

### Book Edition

A book edition is the sellable product/SKU. Cart and order items must point to
an edition, not only to a work.

Fields to consider for `D22-T02`:

- `id`
- `workId`
- `slug`
- `displayTitle`
- `subtitle`
- `language`
- `format`
- `translatorIds`
- `publisherId`
- `isbn13`
- `isbn10`
- `publicationYear`
- `pageCount`
- `dimensions`
- `weightGrams`
- `coverImageId`
- `priceVnd`
- `compareAtPriceVnd`
- `stockQuantity`
- `lowStockThreshold`
- `inventoryStatus`
- `summary`
- `tableOfContents`
- `sampleExcerptPolicy`
- `isFeatured`
- `isActive`
- `createdAt`
- `updatedAt`

Important rule: order item snapshots must copy the edition title, language,
format, unit price VND, and relevant tax/fee estimates at order time.

### Author

An author is a person or organization credited with writing a work.

Fields to consider:

- `id`
- `name`
- `slug`
- `bioShort`
- `country`
- `birthYear`
- `deathYear`
- `sourceNote`
- `isActive`

Content rule: author bios must be self-written or sourced from a clearly
permitted source.

### Translator

A translator is credited on translated editions. A translator can share the
same person model as authors later, but the domain should treat translation as
an edition-level credit.

Fields to consider:

- `id`
- `name`
- `slug`
- `bioShort`
- `sourceNote`
- `isActive`

### Publisher

A publisher represents the edition publisher or imprint.

Fields to consider:

- `id`
- `name`
- `slug`
- `country`
- `website`
- `isActive`

Publisher metadata can be factual, but publisher marketing copy must not be
copied unless clearly permitted.

### Category And Genre

Categories are storefront navigation groups. Genres or themes can be secondary
filters.

Initial category proposal:

| Slug | Vietnamese label | English label | Purpose |
|---|---|---|---|
| `fiction` | Van hoc | Fiction | General novels and literary works |
| `classic-literature` | Van hoc kinh dien | Classic literature | Recognizable long-tail catalog |
| `mystery-thriller` | Trinh tham va giat gan | Mystery and thriller | Strong browsing/filter use case |
| `fantasy-sci-fi` | Gia tuong va khoa hoc vien tuong | Fantasy and sci-fi | Popular genre browsing |
| `romance` | Lang man | Romance | Clear commercial category |
| `business-economics` | Kinh doanh va kinh te | Business and economics | Practical bookstore category |
| `self-development` | Phat trien ban than | Self-development | High-demand local category |
| `children-young-adult` | Thieu nhi va tuoi teen | Children and young adult | Family/age filtering |
| `language-learning` | Hoc ngoai ngu | Language learning | Vietnam-relevant segment |
| `vietnamese-books` | Sach tieng Viet | Vietnamese books | Language-focused shortcut |
| `english-books` | Sach tieng Anh | English books | Language-focused shortcut |

Note: labels are ASCII in this file for edit consistency. UI copy may include
Vietnamese diacritics through the later i18n/content system.

### Language

Supported edition languages for `v1.1`:

- `vi`: Vietnamese
- `en`: English

Optional metadata may store the original work language separately, but the
sellable edition language must be one of the supported storefront languages
unless a future roadmap expands this.

### Format

Initial sellable formats:

- `paperback`
- `hardcover`
- `box-set`
- `special-edition`

Out of scope for `v1.1` unless explicitly added later:

- E-books with DRM or downloads.
- Audiobooks.
- Used-book condition grading.

### ISBN

ISBN fields are factual metadata.

Rules:

- Prefer ISBN-13 where available.
- ISBN-10 is optional.
- Store ISBN as strings, not numbers.
- Validate shape, but do not assume every demo item has a real ISBN.
- Do not fabricate a real ISBN for a fake/demo edition.

### Inventory

Inventory belongs to the sellable edition.

Initial statuses:

- `in-stock`
- `low-stock`
- `out-of-stock`
- `preorder`
- `discontinued`

Rules:

- Public UI may show stock state, not necessarily exact internal stock.
- Admin/staff UI may show exact stock.
- Browser cart state cannot be trusted for stock.
- Server must recalculate stock availability before order creation.
- Inventory adjustment/audit workflow is planned for later roadmap tasks.

### Pricing

Rules:

- Store authoritative price as integer VND.
- `priceVnd` must be nonnegative.
- `compareAtPriceVnd` is optional and must not be lower than `priceVnd` if
  present.
- Do not store USD as the authoritative price.
- English-mode USD is an approximate display derived from VND using configured
  exchange-rate/fee assumptions.
- Tax, shipping, promotion, FX, and international payment fee values must be
  calculated or validated server-side.

### Summaries

Each sellable edition should have a short self-written summary.

Rules:

- Summaries must be original project copy unless the source clearly permits
  reuse.
- Avoid copying publisher descriptions, retailer blurbs, jacket copy, or
  review snippets.
- Keep summaries concise enough for product cards/detail pages.
- If using a real public-domain text, still write the storefront summary in the
  project's own words unless the source license is recorded.

## Customer And Checkout Domain

`v1.1` allows anonymous browsing and cart building, but checkout requires a
customer account.

Customer profile fields:

- Full name.
- Email.
- Phone number.
- Default shipping address.
- Optional saved addresses if the roadmap later keeps scope manageable.

Verification rules:

- Email verification may be represented through Supabase Auth if configured.
- Phone number can be required as a contact field.
- Do not claim phone verification unless a real phone verification provider is
  integrated and tested.

Checkout steps:

1. Cart review.
2. Login or customer account check.
3. Contact/profile completion.
4. Shipping method.
5. Payment method.
6. Server-calculated total review.
7. Submit order.

Payment method identifiers:

- `cod`
- `bank-transfer`
- `momo`
- `zalopay`
- `vnpay`

Payment states:

- `pending`
- `awaiting-transfer`
- `awaiting-provider-confirmation`
- `confirmed`
- `failed`
- `cancelled`

Payment rule: simulated provider selections must never collect real wallet,
bank, or card credentials.

## Roles And Operations

Roles:

- `customer`: browse, cart, checkout, own orders, own profile.
- `staff` or `operator`: manage allowed operational workflows such as orders,
  inventory, and customer support, depending on later permission design.
- `admin`: manage all operational workflows and high-risk settings.

Server/API authorization is mandatory. UI navigation is not an authorization
boundary.

Planned operations:

- Catalog and edition management.
- Category management.
- Stock adjustments and inventory audit.
- Promotions.
- Customer lookup.
- Order status, payment status, shipping status, and internal notes.
- Sales and inventory dashboard.
- CSV export for operational reporting.

## Rule-Based Assistant Domain

The planned assistant is rule-based, not AI-powered.

Supported intents:

- Find a book by title.
- Find books by author.
- Find books by category/genre.
- Find English or Vietnamese editions.
- Explain how to add to cart.
- Explain checkout steps.
- Link to matching catalog/detail pages.
- Suggest recovery when no result is found.

Rules:

- The assistant cannot bypass login-gated checkout.
- The assistant cannot create trusted prices, totals, stock, or orders on its
  own.
- Assistant recommendations must be explainable from catalog data or fixed
  rules.

## Content And Asset Policy

### Lower-Risk Metadata

The following factual metadata is generally lower risk to store when collected
carefully:

- Book title.
- Author name.
- Translator name.
- Publisher name.
- ISBN.
- Edition language.
- Format.
- Publication year.
- Page count.
- Category/genre labels.
- Price entered by the project.
- Stock entered by the project.

Even for factual metadata, record source notes when practical so questionable
records can be audited later.

### Higher-Risk Content

Do not copy these unless clearly licensed, permitted, or created by the project:

- Publisher descriptions.
- Retailer product blurbs.
- Back-cover/jacket copy.
- Editorial reviews.
- Customer reviews.
- Long excerpts.
- Tables of contents if copied from a protected edition.
- Commercial cover images.
- Author biographies from publisher/retailer sites.
- Translator biographies from publisher/retailer sites.

### Allowed Content Sources

Preferred sources for `v1.1` seed data:

- Project-written summaries.
- Project-written author/translator bios.
- Project-created or generated placeholder cover assets.
- Factual metadata typed manually with source notes.
- Public-domain source material only when the source and usage rights are
  recorded.
- Any explicitly licensed content only when the license/source note is recorded.

### Cover Image Rules

Default approach:

- Use safe placeholder/generated/internal covers for seed data.
- Use stable local paths.
- Add a missing-cover fallback.

Do not:

- Hotlink commercial retailer or publisher cover images.
- Download and commit commercial covers without permission.
- Use covers in production UI unless the source is safe enough for the
  portfolio claim.

### Translation Rules

The store can model English originals and Vietnamese translated editions.

Rules:

- Do not copy translated book text.
- Edition summaries should be independently written in the active UI language.
- Translator names can be stored as factual metadata.
- Translation availability is modeled as a relationship between editions of the
  same work, not as automatic machine translation of a book.

## Seed Data Target For v1.1

Target:

- About 100 sellable editions.
- Prefer roughly 50 works with paired English and Vietnamese editions where it
  makes sense.
- Include enough category, author, language, format, price, and stock variety
  to make filters meaningful.

Minimum useful distribution:

- At least 8 categories active.
- At least 20 English editions.
- At least 20 Vietnamese editions.
- At least 10 works with both English and Vietnamese editions linked.
- At least 10 out-of-stock or low-stock examples for operational workflows.
- At least 10 promoted or featured editions for merchandising.

## Acceptance Criteria For D22-T01

- This document replaces the old active phone-accessory domain source of truth.
- Book works, editions, authors, translators, publishers, categories, formats,
  languages, ISBN fields, inventory, pricing, summaries, roles, checkout,
  payment methods, and assistant boundaries are defined.
- The content policy distinguishes lower-risk factual metadata from higher-risk
  copyrighted content.
- The policy states that descriptions/summaries must be project-written unless
  the source is clearly permitted.
- Root and app copies match.

## Next Task

`D22-T02 - Define Book TypeScript Domain Contracts`
