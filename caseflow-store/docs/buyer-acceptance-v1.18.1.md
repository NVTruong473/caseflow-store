# Buyer Acceptance Report - CaseFlow Books v1.18.1

## Decision

Status: **PASS WITH BUYER-OWNED INFRASTRUCTURE PREREQUISITES**

The published-source workflow is reproducible from a checksum-verified archive.
The package can be installed, linted, typechecked, audited, and built without
borrowing files or secrets from the development repository. Full storefront,
authentication, order, and operator acceptance still requires a fresh
buyer-owned Supabase project.

This is a process-isolated clean-room audit, not evidence that an unrelated
human completed the setup without assistance.

## Clean-room Procedure

1. Download the release ZIP and checksum as release assets.
2. Verify SHA-256 before extraction.
3. Extract into a new directory outside the development application.
4. Inspect the archive with the public-export allowlist verifier.
5. Run `npm ci`, lint, typecheck, runtime dependency audit, and Production
   build using only files from the archive.
6. Start the Production server with payment and notifications disabled.
7. Verify static SEO routes, media range delivery, protected-route redirects,
   security headers, and the Production mock-payment lock.
8. Re-run the complete application regression suite and Production smoke after
   fixing any proven release blocker.

## Findings And Corrections

### BA-01: build depended on live catalog availability

- Severity: high for deployment reliability.
- Evidence: the original clean-room build failed while prerendering
  `/sitemap.xml` against an intentionally unreachable Supabase endpoint.
- Correction: sitemap generation now retains static public URLs and omits
  product URLs only when the catalog read fails.
- Verification: clean-room build generated all 66 routes and emitted the
  expected fallback warning; Production SEO still includes the live product
  URL set.

### BA-02: empty optional FX variables caused runtime failure

- Severity: high for first-run usability.
- Evidence: copying `.env.example` unchanged left optional URL/timestamp values
  as empty strings, which failed Zod validation.
- Correction: optional FX environment values are trimmed and blank values use
  validated defaults.
- Verification: focused blank-value check passed; Production metadata,
  catalog, homepage, and checkout regression tests passed.

### BA-03: source package version did not match the release

- Severity: medium for buyer confidence and traceability.
- Correction: the exporter accepts a validated semantic release version and
  writes it into the clean package manifest.
- Verification: the final package reports `caseflow-books@1.18.1`.

### BA-04: development audit warnings

- Runtime audit: zero vulnerabilities.
- Development audit: nine high findings in the current
  ESLint/minimatch/brace-expansion path.
- The available ESLint 10 upgrade was tested in a disposable clean room and
  rejected because it breaks the current Next.js React lint plugin API while
  still leaving six upstream findings.
- Decision: retain the compatible lint toolchain, document the runtime-only
  release gate, and monitor compatible upstream updates. Do not use
  `npm audit fix --force`.

## Acceptance Matrix

| Check | Result | Evidence |
|---|---|---|
| Release checksum | PASS | SHA-256 matched before extraction |
| Public export policy | PASS | 832 files, exactly one Markdown file |
| Secrets/internal material | PASS | zero findings |
| Catalog seed | PASS | 500 active editions, no customer data |
| Package identity | PASS | `caseflow-books@1.18.1` |
| Clean `npm ci` | PASS | 392 packages installed |
| Lint | PASS | zero errors |
| Typecheck | PASS | generated route types and TypeScript completed |
| Runtime dependency audit | PASS | zero vulnerabilities |
| Build without reachable database | PASS | 66 routes; static sitemap fallback |
| Production startup process | PASS | Next.js reached Ready |
| Static SEO/media/security smoke | PASS | 200/206/307 and expected headers |
| Full customer/operator runtime in fresh database | BLOCKED | buyer-owned Supabase not provisioned |
| Docker build | NOT APPLICABLE | no Dockerfile or Compose file |
| Independent human setup | NOT RUN | requires a person outside the project |
| Application regression | PASS | Playwright 41/41 |
| Production smoke | PASS | 9/9 checks |
| Production SEO | PASS | metadata, sitemap, robots and JSON-LD |
| Production security | PASS | nine routes, zero findings |
| Production QR lock | PASS | simulate endpoint returned 404 |

## Buyer Inputs Still Required

- Supabase owner account and a fresh project.
- Database URL, public anon key, and server-only service-role key.
- Store identity, support contacts, canonical domain, and legal owner.
- Approved catalog/cover rights for commercial use.
- Real SMTP/SMS/payment providers only if the buyer elects to enable them.
- Monitoring, backups, incident ownership, and an operating runbook.

## Recommended Human Acceptance

Give the ZIP, checksum, and no additional setup context to a developer who did
not work on the project. Ask them to deploy a fresh Supabase project and
complete: customer registration, catalog search, cart, Buy Now, official
checkout, QR experience, order history, cancellation, staff order processing,
and admin inventory/promotion checks. Record completion time and every question
they needed to ask. That evidence cannot be generated automatically.
