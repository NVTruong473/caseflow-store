# CaseFlow Books Release Candidate

- Candidate: `v1.2.0-rc.1`
- Date: 2026-07-18
- Status: accepted and released as `v1.2.0`
- Release tag: `v1.2.0`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment ID: `dpl_7Y2Qsf4VJRBuzaMGXZMi81Rq5pKQ`

## Passed gates

- Day 25 data/domain freeze remained active.
- Day 30 storefront feature freeze remained active for the original v1.1
  roadmap; v1.2 changes were scoped by ADR-0007 and the accepted v1.2 roadmap.
- Day 34 checkout/auth freeze remained active.
- Day 38 operations freeze remained active except for the explicitly approved
  v1.2 admin content-quality and merchandising operations.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with 42 App Router routes plus proxy.
- Local Playwright: full suite passed `20/20` against a production-style local
  server.
- V12 local aggregate gate: passed with static report aggregation, mobile
  performance baseline, high/critical dependency audit, secret scan, cleanup,
  schema/rollback evidence, and documentation checks.
- Production deploy: Vercel deployment
  `dpl_7Y2Qsf4VJRBuzaMGXZMi81Rq5pKQ` reached `READY` and was aliased to
  `https://caseflow-store.vercel.app`.
- Production smoke: public pages/APIs, canonical alias, robots, sitemap,
  language mode, cart/checkout account boundary, customer boundary, admin
  boundary, assistant, catalog quality, and representative detail pages passed.
- Production catalog quality: 100 active editions, 100 cover responses, 50
  English editions, 50 Vietnamese editions, 100 content metadata records, zero
  active primary placeholder covers, zero broken cover responses, and zero
  public source-review leakage.
- Production Playwright: full suite passed `20/20`.
- Release cleanup check: passed with zero stale QA matches after production
  verification.

## Gate findings resolved

- Placeholder-first public bookstore presentation was replaced with the v1.2
  100-edition catalog, project-created cover portfolio, editorial metadata,
  and truthful merchandising shelves.
- Public catalog/detail/search/assistant/SEO/order/export surfaces were updated
  to consume v1.2 content without exposing internal source-review fields.
- Admin catalog operations were extended with bounded content-quality,
  source-review, cover, and merchandising controls behind server-side role
  checks.
- v1.2 release documentation, screenshots, architecture notes, CV evidence,
  known limitations, release audit, and tracker files were updated to match the
  deployed production state.

## Accepted non-blockers

- Checkout is intentionally simulated and does not process real COD, bank,
  MoMo, ZaloPay, VNPay, or card payments.
- Customer profile phone/email fields are required for checkout readiness but
  are not verified through a real SMS/OTP or email-verification provider.
- Shipping, VAT, FX, and international payment-fee values are configurable
  estimates, not legal/tax advice or live carrier/bank quotes.
- Stock is decremented at order creation, but there is no separate reservation
  or carrier fulfillment workflow.
- Public order tracking is guarded by access code, but does not yet include a
  dedicated rate limiter beyond the app/Supabase/Vercel platform boundaries.
- The 100-edition catalog uses factual source-reviewed metadata, self-written
  display copy, and project-created SVG cover artwork rather than licensed
  commercial cover images or a commercial metadata/feed integration.
- `npm audit --audit-level=moderate` reports 0 high/critical and 2 moderate
  findings inherited through `next@16.2.10 -> postcss@8.4.31`. The automated
  force fix proposes a breaking downgrade, so it was rejected and documented
  in `docs/v1.2-release-audit.md`.

## Evidence

- `.agent/step-results.md` SR-170 and SR-171.
- `caseflow-store/.agent/artifacts/v12-t17/local-quality-gate-check.json`
- `caseflow-store/.agent/artifacts/v12-t18/deployment.json`
- `caseflow-store/.agent/artifacts/v12-t18/vercel-inspect.json`
- `caseflow-store/.agent/artifacts/v12-t18/production-release-smoke.json`
- `caseflow-store/.agent/artifacts/v12-t18/production-playwright-summary.json`
- `caseflow-store/.agent/artifacts/v12-t18/npm-audit.json`
- `caseflow-store/.agent/artifacts/v12-t18/secret-scan.json`
- `caseflow-store/.agent/artifacts/d40-t01/release-cleanup-check.json`
- `caseflow-store/docs/screenshots/`
- `docs/v1.2-release-audit.md`
