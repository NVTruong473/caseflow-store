# ADR-0013: Real Cover And Commerce Homepage Upgrade

- Status: Accepted
- Date: 2026-07-21
- Scope: Post-`v1.8.0` cover realism, assistant customer guidance, asset
  metadata cleanup, and homepage retail polish

## Context

CaseFlow Books already has a 500-edition catalog, account checkout, order
history, QR demo payment safety, and admin/staff operations. The remaining
storefront weakness is visual trust: many covers still share the same
project-generated illustration language, and the homepage can still feel more
like a portfolio surface than an active bookstore.

The user requested real book covers from Project Gutenberg for English works
and Fahasa for Vietnamese editions. The practical constraint is that automated
access to Fahasa product pages/search is not reliable from this environment
because the site returns anti-bot challenge responses. Project Gutenberg cover
thumbnails are accessible for many public-domain works and can be stored as
local assets with source provenance.

## Decision

Create a bounded `real-cover commerce polish` phase:

- Download Project Gutenberg cover thumbnails for matching public-domain works
  into local repository assets.
- Strip embedded metadata from downloaded or generated image assets for
  privacy, deterministic builds, and smaller files.
- Store cover source records with explicit source URL, checked timestamp,
  local path, and limitation notes.
- Use local asset paths only; do not hotlink remote cover URLs from the
  storefront.
- Update the database only after the corresponding local assets exist.
- For Vietnamese editions, prefer an accessible, documented local cover source
  when available. If Fahasa blocks automation or no direct image URL is
  available, reuse the matching original-work local cover as an interim
  product cover and mark it as original-work cover art, not official Vietnamese
  publisher artwork.
- Keep generated covers only for works without an accessible, appropriate
  source image.
- Refresh the homepage around a more commercial reading-floor composition:
  search, category entry points, live shelves, featured cover proof, and clear
  purchase signals without fake social proof.
- Harden the rule-based assistant so customer-facing suggested questions
  always resolve to useful answers, malformed catalog questions recover toward
  similar searches, and out-of-scope/security/admin questions use the neutral
  fallback response.

## Superseded Guardrail

ADR-0012 rejected all copied commercial covers and AI-generated covers for real
books. This ADR narrows that rule:

- Public-domain or otherwise permission-compatible covers may be used when
  copied into local assets with provenance.
- Commercial marketplace covers are not automatically scraped or hotlinked.
- Commercial cover URLs can be added only through a reviewed manifest/source
  process and must remain replaceable.

## Rejected Scope

- No fake reviews, bestseller counts, customer logos, ratings, or sales claims.
- No scraping through anti-bot bypass tooling.
- No claim that an interim cover is an official Vietnamese publisher cover.
- No Project Gutenberg trademark-led merchandising or source branding in
  customer copy.
- No new external image CDN, payment, shipping, email, or AI provider.
- No database schema migration unless a later task requires new fields.

## Consequences

- The storefront becomes more realistic while keeping asset provenance honest.
- Some Vietnamese covers may remain generated or original-work interim covers
  until direct source URLs are provided.
- Production data and deployment must be coordinated so database cover paths do
  not point to assets that are absent from the deployed build.

## Verification

The phase is accepted only when:

- Cover download/apply script proves local files exist and no external cover
  paths are exposed.
- Metadata scan passes for public image assets.
- Assistant customer-question verifier passes.
- Homepage render verifier passes on desktop and mobile without overflow.
- TypeScript, lint, build, and `git diff --check` pass.
