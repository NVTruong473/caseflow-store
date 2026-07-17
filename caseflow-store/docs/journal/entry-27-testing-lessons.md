# Entry 27 - Testing Lessons

Type: retrospective note, not an additional development day.

## What Held Up

The testing strategy scaled with risk. Early work used lint, TypeScript, build, curl, and focused browser checks. Later work added Playwright flows against production-like servers and live Supabase behavior.

The most valuable tests covered boundaries: invalid checkout data, missing products, over-stock quantities, anonymous admin access, customer forbidden access, admin status update, and QA cleanup.

Running both local and production Playwright suites before release gave the final tag stronger evidence.

## What Was Risky

E2E tests against live services can become flaky if they share data, users, ports, or cookies. The project reduced this risk with one worker, deterministic environment parsing, explicit cleanup, and production-server startup control.

## Portfolio Takeaway

The project can credibly claim tested full-stack behavior because tests covered real UI, API, auth, database, production, and cleanup paths.
