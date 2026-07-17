# CaseFlow Books Release Candidate

- Candidate: `v1.1.0-rc.1`
- Date: 2026-07-17
- Status: accepted and released as `v1.1.0`
- Release tag: `v1.1.0`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment ID: `dpl_BkiJt9gDCh5d2cHwAhpFDbLotoAy`

## Passed gates

- Day 25 data/domain freeze remained active.
- Day 30 storefront feature freeze remained active.
- Day 34 checkout/auth freeze remained active.
- Day 38 operations freeze remained active.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `NEXT_PUBLIC_SITE_URL=https://caseflow-store.vercel.app npm run build`:
  passed with 41 app routes.
- Local Playwright: 20 passed.
- Production smoke: home, catalog, detail, account, tracking, products API,
  admin unauthorized boundary, robots, and sitemap passed.
- Production assistant smoke: passed.
- Production Playwright subset: 5 passed.
- Release cleanup check: passed with zero stale legacy matches.
- Secret scan: clean.

## Gate findings resolved

- Legacy E2E tests that still assumed phone accessories and unauthenticated
  checkout were migrated to CaseFlow Books and account-gated checkout.
- A real tablet-width header overflow at `768px` was fixed by moving desktop
  header navigation/actions to the `lg` breakpoint.
- The fixed bookstore-assistant toggle was removed from checkout, account, and
  admin surfaces where it could cover form or operations content on mobile.

## Accepted non-blockers

- Checkout is intentionally simulated and does not process real COD, bank,
  MoMo, ZaloPay, VNPay, or card payments.
- Customer profile phone/email fields are required for checkout readiness but
  are not verified through a real SMS/OTP or email-verification provider.
- Shipping, VAT, FX, and international payment-fee values are configurable
  estimates, not legal/tax advice or live carrier/bank quotes.
- The 100-edition book catalog is curated demo data using factual metadata,
  self-written summaries, and safe placeholder cover assets rather than a
  licensed commercial metadata/feed integration.
- `npm audit --audit-level=moderate` reports 0 high/critical and 2 moderate
  findings inherited through `next@16.2.10 -> postcss@8.4.31`. The available
  automated force fix proposes a breaking downgrade to Next.js 9.3.3, so it was
  rejected and documented in `docs/v1.1-release-audit.md`.

## Evidence

- `.agent/step-results.md` SR-150 and SR-151.
- `caseflow-store/.agent/artifacts/d40-t01/npm-audit.json`.
- `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`.
- `caseflow-store/.agent/artifacts/d40-t02/deployment.json`.
- `caseflow-store/.agent/artifacts/d40-t02/production-smoke-check.json`.
- `caseflow-store/.agent/artifacts/d40-t02/secret-scan.txt`.
- `caseflow-store/playwright-report/index.html`.
- `docs/v1.1-release-audit.md`.
