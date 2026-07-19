# CaseFlow Books Release Candidate

- Candidate: `v1.5.0-rc.1`, accepted and released as `v1.5.0`
- Date: 2026-07-19
- Status: production deployed, smoke tested, tagged, and released
- Governing ADR:
  `docs/adr/0010-qr-demo-payment-provider-boundary.md`
- Release notes:
  `docs/v1.5.0-qr-demo-payment-release-notes.md`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment:
  `dpl_9rMZwbykPksBiFWLLfVyR1i38nPy`

## Passed Local Gates

- Database migration applied additively: `payments` table, indexes, RLS policy,
  and idempotent `mark_demo_payment_paid` RPC.
- Post-migration Supabase checks passed for orders, order items, payments,
  active editions, RLS, and RPC availability.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with 51 App Router routes plus proxy.
- Full Playwright E2E: passed `20/20`.
- Production Playwright E2E: passed `20/20`.
- QR demo payment flow verifier passed against local development runtime:
  order creation, backend-owned total, QR rendering, VietQR CRC/order content,
  simulate paid transition, idempotent retry, bad webhook signature rejection,
  cross-customer payment denial, reload-paid state, and mobile overflow.
- Production-safety verifier passed against local production runtime with mock
  payment disabled.
- Final QA smoke passed against local production runtime with no findings.
- Security posture verifier passed against local production runtime with no
  findings.
- No-demo runtime copy gate passed with intentional QR demo files allowlisted
  and required demo safety labels checked.
- UI regression verifier passed for header brand clipping, homepage internal
  count copy, catalog count wrapping, ISBN/facts overflow, footer support copy,
  and horizontal overflow.
- Release cleanup passed with `totalMatches: 0`.
- Secret scan passed across candidate text files with zero findings.
- `npm audit --audit-level=high`: passed; 0 high/critical advisories.
- `git diff --check`: passed.
- Vercel production deployment
  `dpl_9rMZwbykPksBiFWLLfVyR1i38nPy` reached `READY` and was aliased to
  `https://caseflow-store.vercel.app`.
- Production release smoke passed with public pages, language mode, catalog
  quality, cart/checkout boundary, customer/admin boundary, assistant, and
  representative detail pages.

## Candidate Findings Resolved

- Frontend payment flow no longer creates paid state directly. It calls a
  development-only simulate endpoint that routes through a signed mock webhook
  and shared payment service.
- Payment amount is no longer browser-owned. `POST /api/payments` accepts an
  order identifier, reloads the customer-owned order, and reads
  `orders.total_vnd`.
- Order status and payment status are separated. Payment states include
  `PENDING`, `PAID`, `EXPIRED`, `FAILED`, and `CANCELLED`; order/payment status
  labels were updated for expired state handling.
- Mock payment is production-locked on both frontend and backend. Production
  does not render the simulate button and the simulate endpoint returns a
  denied response.
- QR display includes accessible QR image rendering, server-time countdown,
  loading/error states, retry path, paid state, expired state, and mobile
  overflow checks.
- Recent UI defects reported by screenshot were fixed and covered by a targeted
  regression verifier.

## Accepted Non-Blockers

- The QR provider is a sandbox/demo implementation, not a live bank or wallet
  integration.
- Production payment settlement, reconciliation, refunds, provider dashboards,
  real webhook callbacks, and dispute/failure operations require a separate ADR
  and provider contract.
- The active catalog remains 100 editions. The requested 500-edition expansion
  and realistic repricing require a separate catalog-data migration and source
  review.
- Email confirmation is still not backed by a real email delivery provider
  unless a provider integration is added later.
- The known moderate Next/PostCSS advisory remains accepted because the
  available forced fix proposes a breaking downgrade path.

## Evidence

- `.agent/artifacts/payqr-t01/migration-apply.json`
- `.agent/artifacts/payqr-t01/post-migration-db-checks.json`
- `.agent/artifacts/payqr-t01/qr-demo-payment-flow-check.json`
- `.agent/artifacts/payqr-t01/qr-payment-production-safety-check.json`
- `.agent/artifacts/payqr-t01/ui-regression-check.json`
- `.agent/artifacts/payqr-t01/security-posture-check.json`
- `.agent/artifacts/payqr-t01/final-post-release-qa.json`
- `.agent/artifacts/payqr-t01/final-post-release-qa.md`
- `.agent/artifacts/payqr-t01/no-demo-runtime-copy-check.json`
- `.agent/artifacts/payqr-t01/secret-scan.json`
- `.agent/artifacts/payqr-t01/release-cleanup-check.json`
- `.agent/artifacts/payqr-t01/deployment.json`
- `.agent/artifacts/payqr-t01/production-release-smoke.json`
- `.agent/artifacts/payqr-t01/production-playwright-summary.json`
- `.agent/artifacts/payqr-t01/qr-payment-desktop-pending-vi.png`
- `.agent/artifacts/payqr-t01/qr-payment-desktop-paid-vi.png`
- `.agent/artifacts/payqr-t01/qr-payment-mobile-paid-vi.png`
