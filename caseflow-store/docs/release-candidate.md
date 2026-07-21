# CaseFlow Books Release Candidate

- Candidate: `v1.8.0-rc.1`, accepted and released as `v1.8.0`
- Date: 2026-07-21
- Status: production deployed, smoke tested, tagged, and released
- Governing documents:
  `docs/adr/0012-modern-editorial-bookstore-experience.md`,
  `docs/ui-ux-audit.md`, `docs/v1.8-modern-editorial-bookstore-roadmap.md`,
  and `docs/style-guide.md`
- Release notes:
  `docs/v1.8.0-modern-editorial-bookstore-release-notes.md`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment:
  `dpl_9FRaok8hK8sddmbGBL3RvkMM9fLs`

## Passed Local Gates

- `node scripts/generate-book-cover-source-manifest.mjs`: passed with 500
  products, 500 verified local/project-generated covers, 500 synthetic entries,
  and 0 fallback entries.
- `node scripts/verify-v18-bookstore-experience.mjs`: passed with search,
  category navigation, mobile drawer, cover, motion, no-overflow, and manifest
  checks.
- `npm run lint`: passed.
- `npm exec -- tsc --noEmit --pretty false`: passed.
- `npm run build`: passed with 51 App Router routes plus proxy.
- `npm run test:e2e`: passed `20/20`.
- `npm audit --audit-level=high`: passed for high/critical advisories; the
  known moderate Next/PostCSS advisory remains accepted because the forced fix
  proposes a breaking downgrade path.
- `git diff --check`: passed before deployment.

## Passed Production Gates

- Vercel deployment `dpl_9FRaok8hK8sddmbGBL3RvkMM9fLs` reached `READY` and was
  aliased to `https://caseflow-store.vercel.app`.
- `vercel inspect https://caseflow-store.vercel.app`: passed; alias points to
  deployment `dpl_9FRaok8hK8sddmbGBL3RvkMM9fLs`.
- Production V18 bookstore experience verifier passed with zero findings.
- Production catalog verifier passed with 500 editions and 21 pages.
- Production release smoke passed with public pages, language mode, catalog
  quality at the 500-edition baseline, cart/checkout boundary, customer/admin
  boundary, assistant, and representative detail pages.
- Production security posture passed with zero findings.
- Production QR safety passed with runtime denied status `401`.
- Production final QA smoke passed with zero findings.

## Candidate Findings Resolved

- Header now has a direct title/author/ISBN search entry instead of relying on
  homepage sections for discovery.
- Desktop category discovery is backed by active category data.
- Mobile navigation includes search and category links.
- Book covers use stable `object-fit: contain` treatment and explicit fallback
  labels.
- Cover source assumptions are recorded in
  `assets/book-covers/sources.json`.
- Product-card motion is restrained, CSS-first, and reduced-motion aware.
- Long catalog/detail pages include a non-overlapping bottom-left back-to-top
  control.
- E2E cart fixtures are less flaky because cart data is seeded before React
  cart hydration.

## Accepted Non-Blockers

- The QR provider remains sandbox/demo only and is locked from production
  settlement.
- Production payment settlement, reconciliation, refunds, provider dashboards,
  real webhook callbacks, and dispute/failure operations require a separate ADR
  and provider contract.
- The 500 products are edition variants across the existing 50 works, not 250
  unique works.
- Cover art is local/project-generated portfolio art, not official publisher
  cover artwork.
- Reviews, ratings, wishlist, newsletter, and quick-view remain intentionally
  out of scope until backed by real data/storage/operations.
- Email confirmation is still not backed by a real email delivery provider
  unless a provider integration is added later.
- The known moderate Next/PostCSS advisory remains accepted because the
  available forced fix proposes a breaking downgrade path.

## Evidence

- `docs/v1.8.0-modern-editorial-bookstore-release-notes.md`
- `docs/adr/0012-modern-editorial-bookstore-experience.md`
- `docs/ui-ux-audit.md`
- `docs/v1.8-modern-editorial-bookstore-roadmap.md`
- `docs/style-guide.md`
- `assets/book-covers/sources.json`
- `.agent/artifacts/v18-t01/v18-bookstore-experience-check.json`
- `.agent/artifacts/v18-t02-production/deployment.json`
- `.agent/artifacts/v18-t02-production/v18-bookstore-experience-check.json`
- `.agent/artifacts/v18-t02-production/production-release-smoke.json`
- `.agent/artifacts/v18-t02-production/security-posture-check.json`
- `.agent/artifacts/v18-t02-production/qr-payment-production-safety-check.json`
- `.agent/artifacts/v18-t02-production/final-post-release-qa.json`
- `.agent/artifacts/v18-t02-production/final-post-release-qa.md`
