# Entry 19 - Deployment

Type: real implementation journal entry.

## Goal

Publish the release candidate and verify preview and production deployments with real smoke tests.

## Work Completed

The public GitHub repository `NVTruong473/caseflow-store` was created, the release candidate was committed, and `main` was pushed. Vercel production environment variables were configured as encrypted values without deploying Playwright-only credentials.

A preview deployment was created and smoke-tested. Production was then deployed to the canonical alias `https://caseflow-store.vercel.app`. A production-only admin navigation race was found during acceptance testing, fixed, redeployed, and retested.

## Evidence

- Local and remote commit both matched `c4e4dfa4a7962057652045134ccbc81b7006fe04`.
- Pre-push scan found 0 exact secrets across 331 candidates.
- Preview smoke test returned home 200, catalog 5/16, missing product 404, admin 401, and order 201.
- Production alias returned HTTP 200.
- Final production Playwright suite passed 20/20 in 2.8 minutes.

## Lesson

Deployment was not complete when Vercel said Ready. It was complete only after canonical production behavior, checkout, admin, cleanup, and browser rendering were verified.
