# POSTV121-T01 - Final v1.12.1 Release Consistency Audit

Date: 2026-07-22

## Release State

- Runtime commit: `109d0403b698fa22bde163f64d4bd804da22fc95`
- Annotated tag: `v1.12.1`
- Remote tag object: `75589a6f9b3aa78dadbe61c43c73f9e029d68816`
- Peeled tag commit: `109d0403b698fa22bde163f64d4bd804da22fc95`
- GitHub Release:
  `https://github.com/NVTruong473/caseflow-store/releases/tag/v1.12.1`
- Release status: published, not draft, not prerelease
- Production deployment: `dpl_Ar6sNH1nUraGoK25BhJt6Gn6KCrY`
- Deployment URL:
  `https://caseflow-store-35m7t3fxx-nvt-ruong473.vercel.app`
- Production alias: `https://caseflow-store.vercel.app`

## Verified Result

| Check | Result |
|---|---:|
| Migration preflight/apply/post-cleanup | PASS |
| Old and versioned order RPCs present | PASS |
| Customer/attempt unique index | PASS |
| Voucher/order restrictive history FK | PASS |
| Dedicated concurrent retry test | PASS |
| Signup voucher verifier | PASS, 10/10 |
| QR demo payment verifier | PASS, 6/6 |
| Lint and TypeScript | PASS |
| Production build | PASS, 52 routes |
| Full local Playwright | PASS, 21/21 |
| Architecture and migration verifiers | PASS |
| Secret, no-demo, asset, QR source gates | PASS |
| Post-release evidence secret scan | PASS, 1,329 files / 0 findings |
| Dependency audit | PASS, 0 vulnerabilities |
| Vercel inspect | PASS, READY and aliased |
| Production smoke | PASS |
| Production security posture | PASS, 0 findings |
| Production QR simulation lock | PASS, runtime 401 |
| Full production Playwright | PASS, 21/21 |
| Post-production-test database cleanup | PASS, 12 orders / 12 items / 24 vouchers |
| Git remote tag and GitHub Release | PASS |

## Scope Integrity

- API response envelopes and error codes are unchanged.
- Prices, stock, totals, tax, shipping, payment, auth, and role policies are
  unchanged.
- The browser provides only an idempotency identifier; the server and database
  remain authoritative for customer identity and all commerce values.
- Mock QR settlement remains disabled in production.
- No customer or recorded UAT order was deleted. Cleanup removed only stale
  rows matching dedicated automated-test email prefixes.
- Custom SMTP remains externally blocked pending real credentials.

## Conclusion

`v1.12.1` is consistent across the additive Supabase schema, local Git, remote
GitHub tag, published GitHub Release, Vercel production alias, and fresh
production runtime tests. No further code change is justified without a new
verified defect or explicitly approved roadmap.
