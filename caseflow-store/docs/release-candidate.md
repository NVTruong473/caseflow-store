# CaseFlow Books Release Candidate

- Candidate: `v1.10.0-rc.1`
- Target release: `v1.10.0`, accepted and deployed as `v1.10.0`
- Date: 2026-07-21
- Status: production deployed, smoke tested, and QA verified
- Governing documents:
  `docs/architecture.md`, `docs/style-guide.md`, and
  `docs/v1.10.0-account-bound-signup-voucher-release-notes.md`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment: `dpl_FPZwifR2vJr9ZFDa1cbbJ8y89QsW`

## Release Scope

- Account-bound signup vouchers for customer accounts.
- Three fixed welcome campaigns: `WELCOME30K`, `READMORE20K`, and
  `FREESHIP25K`.
- Customer-visible voucher panels on account and checkout surfaces.
- Homepage/account registration CTAs for welcome codes without fake scarcity.
- Server-owned voucher ownership, expiry, reservation, redemption, and
  one-code-per-order enforcement.
- Real-cover retail visual polish verified locally before release.

## Passed Local Gates

- Supabase migration `0010_customer_signup_vouchers.sql`: applied and verified.
- `npm exec -- tsc --noEmit --pretty false`: passed.
- `npm exec -- tsx scripts/verify-signup-vouchers.ts`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with 51 App Router routes plus proxy.
- `npm run test:e2e`: passed `20/20`.
- `git diff --check`: passed.

## Passed Production Gates

- Vercel deployment `dpl_FPZwifR2vJr9ZFDa1cbbJ8y89QsW` reached `READY` and was
  aliased to `https://caseflow-store.vercel.app`.
- `npx vercel inspect https://caseflow-store.vercel.app`: passed.
- `SIGNUP_VOUCHERS_VERIFY_BASE_URL=https://caseflow-store.vercel.app npm exec -- tsx scripts/verify-signup-vouchers.ts`:
  passed.
- `PRODUCTION_SMOKE_BASE_URL=https://caseflow-store.vercel.app PRODUCTION_SMOKE_ARTIFACT_ID=v1.10.0-production npm exec -- tsx scripts/verify-production-smoke.ts`:
  passed.
- `SECURITY_QA_BASE_URL=https://caseflow-store.vercel.app SECURITY_QA_ARTIFACT_ID=v1.10.0-production npm exec -- tsx scripts/verify-security-posture.ts`:
  passed.
- `PAYQR_PRODUCTION_SAFETY_BASE_URL=https://caseflow-store.vercel.app PAYQR_ARTIFACT_ID=v1.10.0-production npm exec -- tsx scripts/verify-qr-payment-production-safety.ts`:
  passed.
- `FINAL_QA_BASE_URL=https://caseflow-store.vercel.app FINAL_QA_TASK_ID=v1.10.0-production npm exec -- tsx scripts/verify-final-post-release-qa.ts`:
  passed.

## Candidate Findings Resolved

- New customers now have a visible reason to create an account before
  checkout: 3 account-bound welcome codes.
- Checkout shows active account codes close to the promotion-code input, so
  customers do not need to memorize or search for their codes.
- Voucher discounts are still server-owned and cannot be claimed by changing
  client-side state.
- Double-click and duplicated order requests are guarded by short-lived
  voucher reservation tokens.
- Failed order creation releases the voucher reservation instead of burning a
  customer benefit.

## Accepted Non-Blockers

- Email confirmation still depends on Supabase/auth environment behavior; no
  real email marketing or lifecycle automation provider was added.
- Signup vouchers are fixed welcome campaigns, not a full loyalty/wallet
  points system.
- The known moderate Next/PostCSS advisory remains accepted because the
  available forced fix proposes a breaking downgrade path.
- QR demo payment remains locked from production settlement.

## Evidence

- `docs/v1.10.0-account-bound-signup-voucher-release-notes.md`
- `supabase/migrations/0010_customer_signup_vouchers.sql`
- `src/lib/repositories/supabase-customer-vouchers.ts`
- `scripts/verify-signup-vouchers.ts`
- `.agent/artifacts/signup-vouchers/signup-vouchers-check.json`
- `.agent/artifacts/signup-vouchers/home-signup-voucher-cta.png`
- `.agent/artifacts/signup-vouchers/account-signup-vouchers.png`
- `.agent/artifacts/signup-vouchers/checkout-signup-vouchers.png`
- `.agent/artifacts/uat-manual-t01/uat-manual-production-report.json`
- `.agent/artifacts/ui-v20-render-check/ui-v20-render-check.json`
- `.agent/artifacts/v1.10.0-production/production-smoke-check.json`
- `.agent/artifacts/v1.10.0-production/security-posture-check.json`
- `.agent/artifacts/v1.10.0-production/qr-payment-production-safety-check.json`
- `.agent/artifacts/v1.10.0-production/final-post-release-qa.json`
