# POSTV120-T01 - Final v1.12.0 Release Consistency Audit

Date: 2026-07-22

## Objective

Verify that the `v1.12.0` layered architecture hardening release is consistent
across local Git, remote GitHub state, GitHub Release metadata, Vercel
production deployment, and live production runtime checks.

This audit records release evidence after the runtime commit was deployed,
tagged, and published as a GitHub Release. It does not rewrite the release tag.

## Release State

- Runtime commit: `4fd632b1a6b9f515bc47b766aeedc0b601f3917e`
- Tag: `v1.12.0`
- Remote tag object: `6daf2981ec2cfa1f22142f9e5f4f46e06189d4b5`
- Peeled tag commit: `4fd632b1a6b9f515bc47b766aeedc0b601f3917e`
- GitHub Release:
  `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.12.0`
- GitHub Release title:
  `v1.12.0 - Layered Architecture And E2E Regression Hardening`
- GitHub Release status: published, not draft, not prerelease
- Production alias: `https://caseflow-store.vercel.app`
- Vercel deployment: `dpl_8MCASvEYjndhtQJuvbPJeqkFF1gA`
- Vercel deployment URL:
  `https://caseflow-store-l2ab92xgk-nvt-ruong473.vercel.app`

## Checks

| Check | Result | Evidence |
|---|---:|---|
| Local lint | PASS | `npm run lint` |
| Local TypeScript | PASS | `npm exec -- tsc --noEmit --pretty false` |
| Local production build | PASS | `npm run build` |
| Architecture boundary verifier | PASS | `.agent/artifacts/arch-layer-t05/layer-boundaries-check.json` |
| Focused checkout/API Playwright | PASS | `4/4` tests passed |
| Full local Playwright | PASS | `20/20` tests passed |
| No-demo copy gate | PASS | `.agent/artifacts/arch-layer-t06/no-demo-runtime-copy-check.json` |
| Public asset metadata gate | PASS | `.agent/artifacts/arch-layer-t06/asset-metadata-check.json` |
| QR secret scan | PASS | `.agent/artifacts/arch-layer-t06/secret-scan.json` |
| QR production-safety source check | PASS | `.agent/artifacts/arch-layer-t06/qr-payment-production-safety-check.json` |
| QR demo payment flow | PASS | `.agent/artifacts/arch-layer-t06/qr-demo-payment-flow-check.json` |
| Dependency audit | PASS | `npm audit --audit-level=high`, `0` vulnerabilities |
| Vercel inspect | PASS | `dpl_8MCASvEYjndhtQJuvbPJeqkFF1gA` ready and aliased |
| Production smoke | PASS | `.agent/artifacts/arch-layer-t07-production-smoke/production-smoke-check.json` |
| Production security posture | PASS | `.agent/artifacts/arch-layer-t07-production-security/security-posture-check.json` |
| Production QR lock | PASS | `.agent/artifacts/arch-layer-t07-production-qr-safety/qr-payment-production-safety-check.json`, runtime `401` |
| Full production Playwright | PASS | `PLAYWRIGHT_BASE_URL=https://caseflow-store.vercel.app npm run test:e2e`, `20/20` |
| GitHub Release metadata | PASS | `v1.12.0` published, not draft, not prerelease |

## Architecture Result

`POST /api/orders` is now a thin controller. It validates JSON and the request
DTO, then delegates checkout/order orchestration to
`createBookOrderUseCase`. The use case owns customer auth checks, profile and
contact confirmation, server-side cart validation, promotion evaluation,
signup voucher reservation/confirmation/rollback, trusted total calculation,
and Supabase order creation.

The verifier blocks repository and use-case imports from UI, feature, app
route, and Next route APIs. This keeps the project closer to the enterprise
Controller -> Use Case -> Repository pattern without fighting the Next.js
modular monolith.

## Guardrails

- No schema migration was run.
- No customer-facing feature was added.
- No payment behavior changed.
- No auth or role-boundary behavior changed.
- No public API envelope changed.
- The production QR simulate endpoint remains locked.
- Custom SMTP remains blocked pending real Supabase Management API and SMTP
  credentials.

## Conclusion

`v1.12.0` is consistent across GitHub, the published release, Vercel
production, and fresh production runtime checks. The release improves
architecture evidence while preserving the working commerce behavior verified
in prior releases.
