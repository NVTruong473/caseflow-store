# CaseFlow Store Release Candidate

- Candidate: `v1.0.0-rc.1`
- Date: 2026-07-16
- Status: accepted for production deployment

## Passed Gates

- Feature freeze and integration freeze remain active.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- Production build/start: passed with 16 generated pages.
- Chromium E2E: 20/20 passed in 1.6 minutes.
- Failed, flaky, and skipped tests: 0.
- Live Supabase QA orders and temporary users after testing: 0.
- Exact secret matches across 327 commit candidates: 0.
- Dependency audit: 0 critical and 0 high vulnerabilities.

## Gate Findings Resolved

Initial full-suite runs exposed timing races in test-only localStorage seed helpers. The helpers were corrected to wait for the current CartProvider storage write and avoid hidden navigation during seeding. Focused repeat runs passed before the final 20/20 suite.

## Accepted Non-Blockers

- `npm audit --omit=dev` reports two moderate PostCSS advisories inherited through Next.js 16.2.10. The automated force fix proposes a breaking downgrade to Next.js 9.3.3 and was rejected. CaseFlow Store does not accept user-controlled CSS input.
- GitHub push, Production environment variables, and production deployment remain Day 19 work rather than hidden release-candidate blockers.
- Checkout is intentionally simulated and does not collect payment card data.

## Evidence

- `.agent/artifacts/d18-t05-release-candidate-report.png`
- `.agent/artifacts/d18-t05-release-candidate.json`
- `playwright-report/index.html`
