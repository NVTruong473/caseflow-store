# CaseFlow Books v1.18.3 Buyer Readiness

## Decision

`v1.18.3` is ready for source-code demonstration and an independent external
UAT. It is not evidence that a buyer-owned database, sender domain, legal
identity, payment provider, or logistics account has been provisioned.

Independent human UAT status: **NOT RUN**.

## Defects Found And Corrected

| Finding | Risk | Correction |
|---|---|---|
| The assistant trigger could overlay the cart drawer and intercept `Clear cart` | P1 customer action failure | Unmount the assistant while the cart drawer is open |
| A fast add-to-cart click could occur before cart storage hydration | P1 silent lost action | Disable purchase controls and expose readiness until hydration completes |
| A fast order-cancel click could occur before customer history hydration | P1 silent lost action | Gate cancellation and expose order-page readiness until hydration completes |
| Public package and lock metadata identified an older release and retained internal tooling | P1 buyer install/version drift | Normalize package/lock metadata and remove browser/database test dependencies |
| Public archive packaging depended on the latest documentation commit time | P2 reproducibility drift | Derive archive time from the latest runtime-source commit |

No unresolved automated P0, P1, or P2 finding remains.

## Public Source Package

- Version: `1.18.3`
- Files: 832
- Archive: `CaseFlow-Books-v1.18.3-public-source.zip`
- SHA-256:
  `23d8aa9661c4b58ed2e2aab407849126c75853b8ab4b661b81521b4d33693f0b`
- Documentation in export: exactly `README.md`
- Catalog seed: 500 active editions, no customer data
- Runtime parity: every exported runtime file matches the working source
- Internal browser tests, database tooling, prompts, local environment files,
  reports, and secrets: excluded

Two consecutive package runs produced the same checksum.

## Clean-room Verification

The release ZIP was extracted under `/tmp` with no development `node_modules`
or `.env.local`.

| Gate | Status | Evidence |
|---|---|---|
| SHA-256 verification | PASS | Sidecar matched the archive |
| `npm ci --no-audit --no-fund` | PASS | 392 packages installed |
| `npm run lint` | PASS | No ESLint finding |
| `npm run typecheck` | PASS | Route types and TypeScript passed |
| `npm audit --omit=dev --audit-level=high` | PASS | Zero vulnerabilities |
| Production build | PASS | 66 App Router routes generated |
| Production process startup | PASS | Ready in 475 ms |
| Account shell | PASS | HTTP 200 |
| Catalog shell/fallback | PASS | HTTP 200 |
| Admin API boundary | PASS | HTTP 401 |
| Production simulate endpoint | PASS | HTTP 404 |
| Introduction video range delivery | PASS | HTTP 206 |
| Security headers | PASS | CSP, frame, MIME, referrer, permissions headers |
| Data-backed homepage without buyer database | BLOCKED | A reachable buyer Supabase project is required |

The homepage database result is not a product test failure and is not reported
as a pass. A buyer must apply the included schema/migrations/seed and provide
their own environment values before validating data-backed runtime routes.

## Application And Production Verification

- Local full Playwright: PASS, 41/41, one worker, zero retries.
- Layer boundaries: PASS, 249 files, zero findings.
- Secret scan: PASS, 1,697 files, zero findings.
- QR Production-safety static gate: PASS, zero findings.
- Production customer automation: PASS for cart quantity/remove/clear,
  account voucher, isolated phone QR experience, official COD order, account
  history, and customer cancellation.
- Production smoke: PASS, 9/9 routes.
- Production security posture: PASS, nine routes, zero findings.
- Production QR simulate lock: PASS, HTTP 404.
- Production SEO: PASS.
- Production responsive browser audit: PASS, zero findings and no horizontal
  overflow on reviewed surfaces.
- Production cleanup: PASS, zero temporary accounts, profiles, orders,
  payments, catalog rows, or experience records.

Production deployment:
`dpl_GjHNy7YZke4rUhWwjc58w2wedFrw`

Canonical URL:
`https://caseflow-store.vercel.app`

## External UAT Boundary

Automation reduces known regression risk but cannot prove that a person with no
project knowledge understands the product without coaching. The remaining gate
must be run by an independent tester using
`docs/external-buyer-uat-v1.18.3.md`.

Acceptance requires all eight scenarios to run, zero P0/P1/P2 findings, test
data cleanup, and no verbal coaching for primary customer journeys.
