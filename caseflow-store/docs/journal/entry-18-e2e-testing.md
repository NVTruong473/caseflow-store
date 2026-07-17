# Entry 18 - E2E Testing

Type: real implementation journal entry.

## Goal

Prove happy paths and edge cases with browser-driven tests against production-like behavior.

## Work Completed

Playwright configuration was hardened with explicit environment parsing, deterministic production-server startup, bounded timeouts, and one worker for the shared live Supabase test backend.

The suite covered homepage to product to cart to checkout to success, checkout validation failures, admin login and status update, empty cart, missing product, out-of-stock or invalid quantity, and production-like local build/start behavior.

Test data cleanup was treated as part of the pass criteria. QA orders and temporary users had to return to zero after relevant suites.

## Evidence

- Full local suite passed 17/17 at the Day 17 gate.
- Later release-candidate suite passed 20/20 with 0 failed, flaky, or skipped tests.
- Invalid checkout form sent 0 order mutation requests.
- Missing product returned `404/PRODUCT_NOT_FOUND`.
- Out-of-stock quantity returned `409/OUT_OF_STOCK`.
- QA orders and temporary users cleaned to 0.

## Lesson

The strongest tests were not only happy-path screenshots. The valuable tests proved that bad input, missing resources, unauthorized users, and cleanup behavior were controlled.
