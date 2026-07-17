# Entry 26 - Validation And Security Lessons

Type: retrospective note, not an additional development day.

## What Held Up

Zod schemas provided a shared validation language across domain data, cart items, customer input, and order objects. They also helped reject invalid database-mapped rows.

The project consistently avoided trusting browser-submitted commercial data. Server routes recalculated price, subtotal, line total, stock, and order status.

Supabase Auth and RLS were tested through three access levels: anonymous, normal customer, and admin. Secret scans checked commit candidates and build output for service-role and admin-password values.

## What Was Risky

Service-role access is inherently dangerous if it leaks or moves into client code. The project controlled this with server-only modules, ignored environment files, and build/asset scans.

## Portfolio Takeaway

The security story is practical rather than theoretical. It shows validation, RLS, role checks, stable errors, no public secrets, and tests proving unauthorized behavior.
