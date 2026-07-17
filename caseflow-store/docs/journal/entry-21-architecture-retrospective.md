# Entry 21 - Architecture Retrospective

Type: retrospective note, not an additional development day.

## What Held Up

The Next.js modular monolith was the right architecture for the `v1.0.0` scope. Storefront UI, admin UI, Route Handlers, repository logic, validation, and deployment all stayed inside one application without forcing unnecessary service boundaries.

Mock-first development also held up. The UI could be built before Supabase existed, while the repository and validation layers provided a path to replace mock reads with live database reads later.

## What Was Risky

The main architectural risk was not scalability. It was boundary drift: browser cart state, route handlers, Supabase Auth, service-role access, and RLS had to remain clearly separated.

The service-role order path was powerful and necessary, but it required discipline. It could only be used server-side, after validation and authorization.

## Portfolio Takeaway

This architecture demonstrates practical full-stack judgment. It avoids microservices theater while still showing real API, data, auth, security, testing, and deployment boundaries.

## Next Evolution

For a post-MVP bookstore pivot, the monolith should remain unless a clear blocker appears. New bookstore features should begin with an ADR, not a runtime split.
