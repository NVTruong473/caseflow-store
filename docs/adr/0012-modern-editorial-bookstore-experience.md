# ADR-0012: Modern Editorial Bookstore Experience

- Status: Accepted
- Date: 2026-07-21
- Scope: Post-`v1.7.0` storefront UX, visual rhythm, asset provenance, and
  lightweight interaction polish

## Context

CaseFlow Books has a working 500-edition catalog, account-gated checkout,
customer order history, guarded tracking, QR demo payment safety, and
admin/staff operations. The `v1.7.0` release removed several generic
AI-looking patterns, but the storefront still lacks some cues users expect from
a real bookstore: a prominent search entry, category navigation from the
header, richer product-discovery rhythm, explicit cover provenance, and a
small motion system.

The requested references are:

- `https://www.fahasa.com/`
- `https://nhasachphuongnam.com/`
- `https://xcodi.vn/`

They are references for information architecture and rhythm only. CaseFlow
must not copy their branding, banners, images, source code, proprietary
campaigns, or content.

## Decision

Adopt a bounded `modern editorial bookstore commerce` phase for CaseFlow Books.

This phase may improve:

- Header structure, search entry, category navigation, and mobile navigation.
- Homepage editorial rhythm and customer-facing bookshop language.
- Catalog filtering and product-card presentation.
- Product detail reading and purchase hierarchy.
- Local cover fallback honesty and source manifest documentation.
- CSS-only or lightweight client motion where it improves feedback.
- Back-to-top support if it does not compete with checkout or assistant UI.
- QA scripts and docs proving no overflow, no dead controls, and production
  boundaries remain intact.

This phase must preserve:

- Next.js modular monolith.
- Supabase/Auth/RLS boundaries.
- Local cart architecture.
- Server-owned totals and order state transitions.
- QR demo production lock.
- Existing routes and stable API envelopes.
- 500-edition catalog baseline.

## Rejected Scope

Do not add these in this phase unless a later ADR approves the required data and
operations:

- Real reviews, ratings, sales counts, or bestseller claims.
- Wishlist, loyalty points, gift cards, membership rewards, or preorder flows.
- Newsletter subscription unless email storage/consent/provider behavior exists.
- Blog pages with fabricated posts.
- Real chat/support channels not backed by staffed operations.
- Real payment/shipping/email/SMS providers.
- Scraped or hotlinked commercial book covers from reference websites.
- AI-generated covers for real books.
- Heavy animation libraries, parallax, scroll hijacking, or 3D card tilt.

## Consequences

- The public storefront can become more realistic without pretending to be a
  marketplace.
- Some requested features will be documented as intentionally not implemented
  because the current backend or data does not support them truthfully.
- The cover manifest will record generated/local covers as synthetic project
  assets and fallback covers as unverified placeholders rather than claiming
  official edition artwork.
- Motion must be CSS-first and must respect `prefers-reduced-motion`.

## Verification

The phase is accepted only when:

- `docs/ui-ux-audit.md` records current issues, reference findings, and
  accepted/rejected scope.
- `docs/v1.8-modern-editorial-bookstore-roadmap.md` records task IDs,
  acceptance criteria, and verification.
- Local render checks cover desktop, tablet, and mobile.
- TypeScript, lint, production build, and affected Playwright/browser checks
  pass.
- No unsupported commercial proof, fake services, fake reviews, copied covers,
  or real payment-provider claims are introduced.
