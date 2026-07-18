# ADR-0007: Realistic Bookstore Content And Merchandising Upgrade For v1.2

- Status: Accepted
- Date: 2026-07-17
- Planning task: `V12-T01 - Create v1.2 Content And Merchandising ADR`

## Context

CaseFlow Books `v1.1.0` is a released, deployed bookstore and small-business
operations portfolio project. It already has 100 sellable editions, bilingual
storefront content, catalog filters, edition detail pages, an account-gated
checkout, customer orders, staff/admin operations, a rule-based assistant,
SEO, and verified release gates.

The largest credibility gap is now the catalog presentation rather than the
number of commerce features:

- all 100 editions use the same internal placeholder cover;
- some edition-specific facts such as ISBN, page count, publisher, dimensions,
  or publication date are absent or intentionally generic;
- homepage shelves are useful but do not yet feel like deliberate retail
  merchandising;
- the product detail page has the correct purchase flow, but weak product
  identity and limited editorial depth;
- the project has a safe content policy, but no catalog-wide provenance ledger
  or measurable content-completeness gate.

Vietnamese bookstore references such as Tiki and Fahasa make category,
discount, delivery, trust, and buying guidance visible. International book
stores and publishing platforms make cover identity, bibliographic details,
edition linking, samples, related titles, and author discovery prominent. The
project should learn from these information patterns without cloning a
marketplace or fabricating commercial signals it does not possess.

## Decision

Use `v1.2` for a bounded **Realistic Bookstore Content & Merchandising
Upgrade**. The release will improve the truthfulness, visual identity,
discoverability, and editorial presentation of the existing 100-edition
catalog. It is not a new 20-day phase, a marketplace expansion, or a rewrite of
the released commerce and operations system.

### Preserve The Released Architecture

Keep the existing Next.js modular monolith, Supabase, Zod, Playwright, Vercel,
server-owned totals, account-gated checkout, local cart, role model, simulated
payment boundaries, API error contract, and operational workflows unless a
verified blocker requires a separate ADR.

Prefer content, asset, validation, repository, and presentation changes. Add a
database migration only when the baseline audit proves that the current
`source_note`, cover asset, work, edition, and featured fields cannot represent
the accepted v1.2 requirements cleanly.

### Adopt A Provenance-First Catalog

Every active work, edition, and non-placeholder cover used by v1.2 must have a
reviewable source record. At minimum, that record must identify:

- the source label and stable URL when one exists;
- the date the source was checked;
- whether the value is a bibliographic fact, project-written text, internal or
  generated media, clearly licensed media, or verified public-domain media;
- license or rights-basis notes for reusable media;
- attribution requirements and the location where attribution is rendered;
- review status and any unresolved uncertainty.

API availability is not equivalent to copyright permission. Google Books and
Open Library can help identify volumes, ISBNs, authors, publishers, dates,
dimensions, and candidate cover records, but imported descriptions and cover
art are not automatically approved for local copying or unrestricted reuse.

### Use Real Books Without Inventing Real Editions

- Work-level titles and authors may represent real books.
- Edition-level publisher, translator, ISBN, page count, publication date,
  dimensions, and format must refer to a specific sourced edition or remain
  absent.
- Do not fabricate ISBNs or combine facts from several editions into one SKU.
- Unknown optional facts must be omitted from the storefront instead of shown
  as `TBC`, `demo`, or a false value.
- VND price, stock, promotion, and availability are CaseFlow Books operational
  values. They must not be described as current market prices or publisher
  inventory unless a future integration proves that claim.
- Bilingual summaries and merchandising copy remain project-written unless a
  source explicitly permits reuse.

### Replace The Single Placeholder With A Defensible Cover Portfolio

The default v1.2 asset order is:

1. project-created or generated edition-specific cover art that is not derived
   from a protected commercial cover;
2. clearly public-domain cover art with source and rights evidence;
3. explicitly licensed cover art with recorded license and attribution;
4. the existing internal placeholder only as an error fallback, not as the
   primary image for the released catalog.

English and Vietnamese editions of the same work may share a visual family,
but their language, title, and edition identity must remain clear. A cover made
by the project must be presented as an edition-specific illustrative asset and
must not imitate or imply approval from a commercial publisher.

Open Library cover URLs may be evaluated under its public-display guidelines,
rate limits, and attribution expectations. They are not a blanket license to
download and commit every available cover. Wikimedia Commons assets may be
used only when the individual file page records a compatible license or a
public-domain basis; the existence of an image on Commons is not enough by
itself.

### Make Merchandising Truthful And Data-Backed

The storefront may add or improve shelves such as:

- editor-selected books;
- new or recently updated editions;
- English/Vietnamese edition pairs;
- books by category, theme, author, language, format, or price band;
- low-stock or promotion shelves when backed by current store data;
- related works and more-by-this-author groups.

Do not display fake ratings, copied reviews, fabricated sold counts, invented
rankings, or a `bestseller` claim without sufficient first-party order data and
a documented calculation window. Editorial labels must be distinguishable from
behavioral or sales-derived labels.

### Improve The Existing Buying Surfaces

The v1.2 presentation work will focus on the existing homepage, catalog cards,
catalog results, and book detail page:

- covers become the primary product-recognition signal;
- title, author, language, format, price, stock, and edition relationship stay
  scannable;
- detail pages expose only verified bibliographic facts;
- edition comparison, related books, and buying-confidence information remain
  close to the purchase action;
- bilingual copy is complete in both language modes;
- image dimensions, responsive layout, accessibility, SEO, and performance are
  release criteria rather than a final cosmetic pass.

The admin catalog should expose enough content-quality and merchandising state
for an operator to find incomplete records and manage approved shelves. This
does not authorize a general-purpose CMS.

## Catalog Quality Gates

`v1.2.0` cannot be accepted unless all active editions satisfy these rules:

- 100% have an edition-specific primary image or an approved shared visual
  family; the generic placeholder count in primary catalog rendering is zero;
- 100% have bilingual project-written summaries and meaningful localized alt
  text;
- 100% have title, author, language, format, VND price, stock state, category,
  and source review status;
- every displayed ISBN, publisher, translator, page count, date, dimension, or
  weight is traceable to the same edition;
- storefront text contains no visible `TBC`, seed/debug language, copied
  publisher blurbs, or unsupported commercial claims;
- every non-internal image passes source, rights-basis, attribution, and
  availability checks;
- image loading does not cause layout shift or make catalog pages exceed the
  accepted performance budget;
- automated checks and representative desktop/mobile screenshots prove the
  homepage, catalog, detail, language, cart-entry, and admin content workflows.

## Alternatives Considered

### Copy Commercial Covers And Descriptions From Retailers

Rejected. It would make the site look realistic quickly but would create
copyright, attribution, takedown, hotlink, availability, and portfolio-integrity
risks.

### Import Google Books Or Open Library Data Directly At Runtime

Rejected as the default architecture. External metadata can be incomplete,
edition matching can be wrong, cover use needs separate review, and runtime
dependency would add latency and availability risk. These services may support
a reviewed ingestion workflow instead.

### Generate Visual Covers But Leave Metadata Generic

Rejected. Distinct images alone would hide the deeper problem: incomplete or
mixed edition facts make the catalog commercially untrustworthy.

### Add Reviews, Wishlist, AI Recommendations, And E-books First

Rejected for v1.2. These features add moderation, privacy, ranking, licensing,
download/DRM, or external-service boundaries while leaving the current catalog
credibility problem unresolved.

### Rebuild The Entire Storefront

Rejected. The existing discovery and purchase flows are released and tested.
The upgrade should improve their content hierarchy and retail presentation
without discarding proven behavior.

## Consequences

Positive:

- the same 100-edition catalog can look substantially more credible without
  pretending to be a marketplace;
- the portfolio demonstrates content modeling, data provenance, media policy,
  merchandising logic, accessibility, performance, and release discipline;
- content mistakes become measurable and reviewable instead of subjective;
- storefront and admin improvements remain aligned around the same catalog
  source of truth.

Negative:

- rights review and edition matching are slower than copying search results;
- generated/internal covers may not match covers currently sold by Vietnamese
  publishers and must not imply that they do;
- some real books will still have omitted edition fields when no trustworthy
  source is available;
- a useful content-quality workflow may require a small schema migration after
  the audit;
- 100 distinct, optimized, bilingual assets increase review and regression
  cost.

## Guardrails

- Complete and verify the v1.2 roadmap before runtime implementation.
- Work one `V12-*` task at a time and preserve evidence after every task.
- Do not rewrite or retag `v1.1.0`; v1.2 changes belong to a new release line.
- Do not represent v1.2 as additional Day 41+ development history.
- Do not collect real payment credentials or claim real payment processing.
- Do not add e-book downloads, DRM, copyrighted excerpts, customer reviews,
  wishlists, AI recommendations, or marketplace behavior under this ADR.
- Do not fake ratings, sold counts, bestseller rankings, market prices, or
  publisher relationships.
- Do not display a source-dependent asset after its license, attribution, or
  availability check fails.
- Keep VND authoritative and keep server-side price, stock, promotion, tax,
  fee, shipping, and total validation unchanged.
- Keep server-side role checks and the stable API error contract unchanged
  except for a separately approved, release-blocking correction.

## Reference Inputs

- [Tiki bookstore](https://tiki.vn/nha-sach-tiki/c8322) and
  [Tiki bestsellers](https://tiki.vn/bestsellers/nha-sach-tiki/c8322) for
  Vietnam-first category, price, delivery, discount, and trust presentation.
- [Fahasa](https://www.fahasa.com/) and its
  [ordering guide](https://www.fahasa.com/huong-dan-dat-hang) for local
  bookstore navigation and purchase guidance.
- [Amazon book detail page guidance](https://kdp.amazon.com/en_US/help/topic/GUZR8PFPPVNYFTUN)
  for cover, title, author, description, category, sample, edition-linking, and
  comparison patterns.
- [Kobo product page guidance](https://kobowritinglife.zendesk.com/hc/en-us/articles/360058975372-Navigating-your-Book-s-Product-Page)
  for bibliographic detail, previews, series, related titles, and more-by-author
  patterns.
- [Google Books API volume documentation](https://developers.google.com/books/docs/v1/reference/volumes)
  for available volume identifiers and bibliographic fields.
- [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers) for
  cover lookup patterns, public-display guidance, and rate limits.
- [Wikimedia Commons copyright guidance for book covers](https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter)
  for the default presumption that modern book-cover designs remain protected.

## Implementation Gate

`V12-T02` must define the ordered tasks, acceptance criteria, evidence, freeze
gates, rollback expectations, and final `v1.2.0` release gate. Runtime work may
start only after that roadmap is accepted and the user confirms the first
implementation task.
