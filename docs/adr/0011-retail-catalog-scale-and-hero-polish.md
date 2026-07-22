# ADR-0011: Retail Catalog Scale And Hero Polish

- Status: Accepted
- Date: 2026-07-19
- Planning task: `V16-T01 - Retail Catalog Scale And Hero Copy Hotfix`

## Context

After `v1.5.0`, production still exposed a 100-edition catalog and homepage
hero chips that sounded like internal implementation notes instead of
customer-facing bookstore merchandising. The user asked for the catalog to
reach 500 sellable book products and for the homepage copy to read like an
active retail bookstore.

The existing bookstore domain models products as `book_editions`, not only
unique works. The current catalog already has 50 real works with paired English
and Vietnamese editions. Adding hundreds of unrelated titles quickly would
increase data noise, source-review risk, and UI repetition without improving
commerce realism.

## Decision

Scale the public catalog to 500 active sellable editions by adding four
additional retail edition families for every existing bilingual work:

- reader paperback;
- library hardcover;
- collector or annotated special edition;
- reading-group box set.

Each family keeps one English and one Vietnamese edition, preserving catalog
parity at 250 English and 250 Vietnamese products. The existing 100 active
editions remain available and receive a pricing refresh so no active product
keeps unrealistically low display prices.

Homepage hero copy must use customer-facing retail signals: catalog scale,
bilingual selection, and practical payment options. It must not use internal
phrases such as "stock visibility", "account-gated checkout", "quick
discovery", or "visible stock" as hero value propositions.

## Scope

Allowed:

- idempotent production data upsert for new editions and generated cover
  assets;
- additive generated SVG cover files under `public/images/books/v16-covers`;
- price refresh for active book editions;
- homepage copy and catalog result-count layout polish;
- current QA script updates from the 100-edition baseline to the 500-edition
  baseline.

Not allowed:

- new database schema changes;
- copying commercial book covers without a tracked rights basis;
- fake ISBN values for generated retail editions;
- changing checkout, auth, payment, shipping, or admin authorization behavior;
- claiming real warehouse scale, real payment settlement, or real publisher
  inventory contracts.

## Consequences

Positive:

- production catalog scale now matches the user-facing expectation;
- product count increases without diluting the existing bilingual work model;
- generated covers remain source-safe and portfolio-defensible;
- QA gates test the current 500-edition baseline.

Negative:

- the 500 products are edition variants across 50 works, not 250 unique works;
- generated retail editions do not represent real publisher-specific ISBN
  inventory;
- future expansion to hundreds of unique works still needs a separate
  provenance curation pass.

## Acceptance Criteria

- Supabase production has exactly 500 active editions.
- Active language distribution is 250 English and 250 Vietnamese.
- At least 400 active editions use the `v16` generated retail-edition source
  key and local generated covers.
- Active prices use realistic VND retail bands and no active edition is below
  99,000 VND.
- Homepage hero no longer shows internal implementation copy and shows the
  live catalog count.
- Catalog result count does not wrap vertically at tablet/desktop widths.
- Lint, typecheck, build, targeted UI verifier, production smoke, and final QA
  are rerun after the data and code changes.
