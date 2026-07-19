# CaseFlow Books Release Candidate

- Candidate: `v1.7.0-rc.1`, accepted and released as `v1.7.0`
- Date: 2026-07-19
- Status: production deployed, smoke tested, tagged, and released
- Governing documents:
  `docs/ui-humanization-audit.md` and `docs/style-guide.md`
- Release notes:
  `docs/v1.7.0-ui-humanization-release-notes.md`
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment:
  `dpl_EKSUm28mL8w4acchGxoZeeJA8iJc`

## Passed Local Gates

- `npx tsc --noEmit --pretty false`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with 51 App Router routes plus proxy.
- `npm run test:e2e`: passed `20/20`.
- Admin dashboard verifier passed with cancelled/rejected orders counted under
  cancelled payment state instead of pending/awaiting payment.
- Admin/staff order operations verifier passed with server-side cancellation
  normalization for open payment and shipping states.
- UI humanization verifier passed locally for header, homepage, catalog,
  detail metadata wrapping, keyboard focus, reduced motion, and no checked
  overflow.
- Catalog page verifier passed locally with 500 editions, 24 cards per page,
  and 21 pages.
- QR production-safety verifier passed static checks.
- Security posture verifier passed against a local production-style server.
- Release cleanup passed with `totalMatches: 0`.
- Secret scan passed with zero findings.
- `npm audit --audit-level=high`: passed; 0 high/critical advisories.
- `git diff --check`: passed before deployment.

## Passed Production Gates

- Vercel deployment `dpl_EKSUm28mL8w4acchGxoZeeJA8iJc` reached `READY` and was
  aliased to `https://caseflow-store.vercel.app`.
- `vercel inspect https://caseflow-store.vercel.app`: passed; alias points to
  deployment `dpl_EKSUm28mL8w4acchGxoZeeJA8iJc`.
- Production catalog verifier passed with 500 editions and 21 pages.
- Production UI humanization verifier passed.
- Production release smoke passed with public pages, language mode, catalog
  quality at the 500-edition baseline, cart/checkout boundary, customer/admin
  boundary, assistant, and representative detail pages.
- Production security posture passed with zero findings.
- Production QR safety passed with runtime denied status `401`.
- Production final QA smoke passed with zero findings.

## Candidate Findings Resolved

- The public storefront no longer exposes admin navigation as a customer-facing
  tab.
- Homepage layout now uses a bookstore-specific reading table and spine rail
  instead of a generic centered landing-page stack.
- Catalog intro and quick links have lighter hierarchy and less repeated
  pill/card treatment.
- Product-detail edition notes and metadata wrapping avoid implementation copy
  and long-code overflow.
- Reading-path cards no longer wrap `Step 2` or `Step 4` vertically at the
  audited desktop width.
- Cancelled/rejected orders with stale active payment statuses no longer appear
  as pending/awaiting payment in the admin dashboard.
- Admin/staff cancellation now normalizes open payment and shipping states on
  the server, not only through UI dropdown behavior.

## Accepted Non-Blockers

- The QR provider is a sandbox/demo implementation, not a live bank or wallet
  integration.
- Production payment settlement, reconciliation, refunds, provider dashboards,
  real webhook callbacks, and dispute/failure operations require a separate ADR
  and provider contract.
- The 500 products are edition variants across the existing 50 works, not 250
  unique works. Generated v1.6 editions intentionally omit ISBNs instead of
  inventing fake identifiers.
- Email confirmation is still not backed by a real email delivery provider
  unless a provider integration is added later.
- The known moderate Next/PostCSS advisory remains accepted because the
  available forced fix proposes a breaking downgrade path.
- Production Playwright `20/20` was not rerun after the production deploy for
  this UI-focused release. The full local E2E suite and production smoke, UIH,
  catalog, security, QR-safety, and final QA gates passed.

## Evidence

- `docs/v1.7.0-ui-humanization-release-notes.md`
- `docs/ui-humanization-audit.md`
- `docs/style-guide.md`
- `.agent/artifacts/ui-humanization-t01/ui-humanization-check.json`
- `.agent/artifacts/uih-t01-order-fix/ui-humanization-check.json`
- `.agent/artifacts/uih-t01-order-fix/home-1024-reading-path-full.png`
- `.agent/artifacts/uih-t01-order-sync/admin-order-operations-check.json`
- `.agent/artifacts/d38-t01/admin-dashboard-check.json`
- `.agent/artifacts/v17-t01-production/ui-humanization-check.json`
- `.agent/artifacts/v17-t01-production/production-release-smoke.json`
- `.agent/artifacts/v17-t01-production/security-posture-check.json`
- `.agent/artifacts/v17-t01-production/qr-payment-production-safety-check.json`
- `.agent/artifacts/v17-t01-production/final-post-release-qa.json`
