# ADR-0008: Visual Merchandising And Brand Polish For v1.3

- Status: Accepted
- Date: 2026-07-18
- Planning task: `V13-T01 - Create Visual Merchandising ADR And Roadmap`

## Context

CaseFlow Books `v1.2.0` is a released, deployed bookstore and small-business
operations demo. It has the right product shape: 100 active editions, 100
project-created cover assets, bilingual content, account-gated checkout,
customer order flows, admin/staff operations, and production release evidence.

The remaining weakness is not a missing commerce feature. The risk is visual:
the app can still feel too uniform because the base design system was created
for a practical e-commerce MVP and still leans on a narrow blue/white/slate
palette. The bookstore now has richer content and cover assets than the visual
system fully expresses.

The user explicitly approved applying the proposed visual polish roadmap
automatically, with verification after each step. This ADR gives that roadmap
permission while keeping the release honest and bounded.

## Decision

Use `v1.3` for a bounded **Visual Merchandising & Brand Polish** phase. The
phase will improve color depth, bookstore identity, cover-led merchandising,
and visual hierarchy across the existing storefront and admin surfaces.

The work is design-system and presentation polish, not a product-scope
expansion. It must preserve the released commerce architecture and the
v1.2 catalog/content provenance model.

## Scope

Allowed:

- expand design tokens for a warmer bookstore palette;
- add reusable visual merchandising helpers that compose existing project-made
  cover SVGs into shelves, stacks, or cover-led panels;
- polish homepage, catalog, product detail, checkout/account boundary, and
  admin catalog/dashboard visuals in place;
- improve spacing, contrast, empty/loading/error states, and responsive visual
  rhythm;
- add verification scripts and screenshots for visual QA.

Not allowed under this ADR:

- payment-provider integration or real payment credential collection;
- SMS/OTP, real email verification, or shipping-carrier integrations;
- database schema changes, production data migrations, or new external
  services;
- copied commercial book covers, copied publisher blurbs, fake ratings,
  fabricated sold counts, bestseller claims, or fake marketplace signals;
- full route rebuilds, deleting existing route trees, or changing the stable
  public/admin API error contract;
- turning the storefront into a decorative landing page at the expense of
  catalog discovery and purchase flow.

## Design Direction

CaseFlow Books should feel like a serious independent online bookstore for
Vietnam-first bilingual reading, not a generic SaaS page and not a marketplace
clone.

The visual language should use:

- warm paper and ink foundations for reading comfort;
- a restrained moss/teal discovery accent;
- wine or oxblood highlights for classics/editorial shelves;
- amber accents for real offers and attention, not decorative noise;
- muted navy/slate for admin and operational trust;
- existing v1.2 cover SVGs as the main visual assets.

The system must avoid one-note palettes, oversized marketing hero patterns,
floating decorative blobs, stock photography that does not show the real
product, and visual changes that reduce scannability.

## Hallmark-Informed Guardrails

Hallmark is treated as an audit inspiration, not a runtime dependency or a
license to bulldoze the app. The useful rules for this project are:

- audit before redesign;
- preserve routes, information architecture, copy intent, and production files;
- edit in place unless an additive component clearly reduces duplication;
- use named tokens instead of one-off colors;
- verify mobile widths and avoid horizontal overflow;
- prefer structural visual variety over color swaps;
- keep copy honest and do not invent metrics or commercial proof.

The project will not install Hallmark into the app runtime and will not copy
Hallmark test pages or templates.

## Acceptance Criteria

The `v1.3` polish phase can be accepted only if:

- all major public buying surfaces retain their current user flows;
- homepage, catalog, product detail, and admin catalog/dashboard have
  screenshot evidence at mobile and desktop sizes;
- color use is backed by design tokens and avoids a single-hue theme;
- every new visual asset is built from existing project-created covers,
  CSS/Tailwind, or safe local assets;
- no card-in-card layout, text overlap, horizontal overflow, fake proof,
  commercial cover copying, or external stock imagery is introduced;
- TypeScript, ESLint, production build, and affected Playwright/visual checks
  pass before final acceptance.

## Consequences

Positive:

- the released bookstore will look less template-like without adding risky
  product scope;
- the portfolio will better demonstrate taste, restraint, visual QA, and
  design-system discipline;
- existing project-created covers become stronger merchandising assets;
- admin stays operational rather than decorative.

Negative:

- visual polish can regress responsive layouts if not checked at small widths;
- richer color can reduce contrast if token choices are not verified;
- over-polishing can make the site feel like a landing page instead of a store;
- changing screenshots and artifacts increases repository size.

## Guardrails

- Work one `V13-*` task at a time.
- Verify each task before moving to the next.
- Do not create a `v1.3.0` tag until the final V13 gate passes.
- Do not deploy automatically unless a later task explicitly requires it.
- Keep `v1.2.0` unchanged as the last production release tag.
- Keep the known payment, verification, shipping, metadata, and cover-license
  boundaries visible in docs.
