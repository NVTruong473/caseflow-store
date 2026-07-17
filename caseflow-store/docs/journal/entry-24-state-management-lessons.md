# Entry 24 - State Management Lessons

Type: retrospective note, not an additional development day.

## What Held Up

React Context plus localStorage was enough for a guest cart MVP. Persisting only `productId` and `quantity` kept the client state small and intentionally untrusted.

Versioning the localStorage payload gave the app a way to reject stale or malformed cart data. Tampered over-stock cart state produced a visible error and recovery action rather than silently proceeding.

Checkout success storage was intentionally narrow. It supported the immediate confirmation experience without pretending to be a durable order source.

## What Was Risky

Client state can create race conditions in tests, especially when storage setup and UI hydration happen at different times. Some release-candidate work had to resolve test-only cart storage races before the suite was accepted.

## Portfolio Takeaway

The project demonstrates the right state-management instinct: keep local state ergonomic, but make server validation the source of truth for business data.
