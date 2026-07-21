# CaseFlow Books Release Candidate

- Candidate: `v1.9.0-rc.1`, accepted and deployed as `v1.9.0`
- Date: 2026-07-21
- Status: production deployed, Supabase cover references applied, smoke tested,
  and QA verified
- Governing documents:
  `docs/adr/0013-real-cover-and-commerce-homepage-upgrade.md`,
  `docs/v1.9-real-cover-commerce-polish-roadmap.md`,
  and `docs/style-guide.md`
- Release notes:
  `docs/v1.9.0-real-cover-commerce-polish-release-notes.md`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment:
  `dpl_GozgRJiNvpPTwC2WUua9VXXovErd`

## Passed Local Gates

- `npm exec -- tsx scripts/apply-v19-gutenberg-covers.ts --download --verify-local`:
  passed with 49 local Gutenberg JPEG covers and zero APP/comment metadata
  segments.
- `node scripts/verify-public-asset-metadata.mjs`: passed across 565 public
  image files with zero findings.
- `npm exec -- tsx scripts/verify-assistant-customer-questions.ts`: passed.
- `npm exec -- tsx scripts/verify-v19-commerce-homepage.ts`: passed locally.
- `npm run lint`: passed.
- `npm exec -- tsc --noEmit --pretty false`: passed.
- `npm run build`: passed with 51 App Router routes plus proxy.
- `git diff --check`: passed before deployment.

## Passed Production Gates

- Vercel deployment `dpl_GozgRJiNvpPTwC2WUua9VXXovErd` reached `READY` and was
  aliased to `https://caseflow-store.vercel.app`.
- `vercel inspect https://caseflow-store.vercel.app`: passed; alias points to
  deployment `dpl_GozgRJiNvpPTwC2WUua9VXXovErd`.
- `npm exec -- tsx scripts/apply-v19-gutenberg-covers.ts --apply --verify-local`:
  passed after deployment with 49 cover rows and 490 active edition references
  updated.
- `node scripts/generate-book-cover-source-manifest.mjs`: passed against
  production with 500 products, 500 verified covers, 490 public-domain-local,
  10 project-generated, and 0 fallback.
- Production V19 homepage verifier passed with Gutenberg covers required.
- Production V18 compatibility verifier passed with the new cover-source mix.
- Production release smoke passed.
- Production security posture passed with zero findings.
- Production QR safety passed with runtime denied status `401`.
- Production final QA smoke passed with zero findings.

## Candidate Findings Resolved

- Homepage hero now behaves like a retail entry point with catalog search,
  quick category links, browse/order-tracking CTAs, and a live front-table
  shelf.
- 490 active editions now use local Project Gutenberg source-work covers.
- Public image assets no longer carry embedded SVG generator/provenance
  metadata.
- Assistant suggestion, malformed query, and off-topic/admin/security behavior
  now has automated browser coverage.

## Accepted Non-Blockers

- The QR provider remains sandbox/demo only and is locked from production
  settlement.
- Production payment settlement, reconciliation, refunds, provider dashboards,
  real webhook callbacks, and dispute/failure operations require a separate ADR
  and provider contract.
- The 500 products are edition variants across the existing 50 works, not 500
  unique works.
- 10 *The Old Man and the Sea* editions still use generated cover art because
  no matching Project Gutenberg public-domain source cover was mapped.
- Fahasa automation is blocked by anti-bot challenge responses; future official
  Vietnamese cover updates need reviewed direct image URLs or licensed assets.
- Reviews, ratings, wishlist, newsletter, and quick-view remain intentionally
  out of scope until backed by real data/storage/operations.
- Email confirmation is still not backed by a real email delivery provider
  unless a provider integration is added later.
- The known moderate Next/PostCSS advisory remains accepted because the
  available forced fix proposes a breaking downgrade path.

## Evidence

- `docs/v1.9.0-real-cover-commerce-polish-release-notes.md`
- `docs/adr/0013-real-cover-and-commerce-homepage-upgrade.md`
- `docs/v1.9-real-cover-commerce-polish-roadmap.md`
- `docs/style-guide.md`
- `assets/book-covers/sources.json`
- `assets/book-covers/gutenberg-sources.json`
- `.agent/artifacts/v19-production/commerce-homepage-check.json`
- `.agent/artifacts/v19-production/production-smoke-check.json`
- `.agent/artifacts/v19-production/security-posture-check.json`
- `.agent/artifacts/v19-production/qr-payment-production-safety-check.json`
- `.agent/artifacts/v19-production/final-post-release-qa.json`
- `.agent/artifacts/v19-production/final-post-release-qa.md`
