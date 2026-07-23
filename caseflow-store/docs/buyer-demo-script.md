# Buyer Demo Script

Target duration: 8–12 minutes.

The goal is to demonstrate product depth and engineering evidence, not imply
that the reference deployment processes real money or fulfills real orders.

## 1. Product Positioning

Open `https://caseflow-store.vercel.app`.

Say:

> This is a working reference implementation for a bilingual specialist
> bookstore and small-business operations team. It can be customized for a
> buyer’s brand, catalog, policies, and approved providers after discovery.

Show:

- desktop/mobile responsive header;
- Vietnamese/English switch;
- search-first navigation;
- 500-edition catalog and merchandising shelves;
- VND source pricing and clearly separated approximate USD display.

Do not claim real traffic, revenue, customers, publisher partnerships, or
licensed commercial catalog feeds.

## 2. Discovery And Purchase

1. Search by title or author.
2. Filter by category, language, format, price, and stock.
3. Open a book and compare paired English/Vietnamese editions.
4. Show stock, price, format, summary, provenance-safe facts, and related
   books.
5. Add an edition to cart.
6. Open checkout and show the account/profile gate.

Explain that the browser cart is untrusted: the server reloads catalog records
and recalculates price, promotion, VAT, shipping, payment fee, stock, and final
total.

## 3. Customer Account

Use a disposable test account in a controlled UAT environment. Never share a
permanent password in a public demo.

Show:

- email-confirmed account and checkout-ready profile;
- three account-bound welcome vouchers and one-code-per-order enforcement;
- simulated order placement;
- separate order/payment/shipping status;
- account notification inbox;
- order history without remembering the order code;
- eligible customer cancellation;
- guarded public tracking using order code plus matching contact.

State that payment choices are simulations and QR success controls are locked
in Production.

## 4. Staff And Admin Operations

Use separate test identities.

Staff:

- dashboard and orders;
- catalog/inventory operations;
- notification operations;
- simulated-transfer confirmation/rejection;
- blocked admin-only settings.

Admin:

- settings and promotion authority;
- customer/role oversight;
- order rejection with internal reason;
- CSV export and dashboard visibility.

Show a `403` boundary or signed-out admin redirect if useful. UI hiding is not
the security boundary; APIs repeat server-side session/role checks.

## 5. Engineering Evidence

Show:

- Controller -> Use Case -> Repository path for order creation;
- Supabase migrations/RLS;
- typed validation and stable API envelope;
- Playwright suite and release artifacts;
- Production security, QR-lock, secret, accessibility, SEO, and cleanup
  reports;
- centralized storefront configuration and buyer handoff documents.

## 6. Honest Close

Included now:

- working source and reference deployment;
- storefront, customer, staff, and admin flows;
- simulated commerce operations;
- configuration and migration contracts;
- automated QA/release evidence.

Buyer-specific work:

- legal identity and policies;
- product data and media rights;
- custom domain and buyer-owned accounts;
- real payment, email/SMS, logistics, tax/accounting;
- load/SLO targets and ongoing operations.

End by opening `docs/buyer-discovery-questionnaire.md`, not by promising an
instant launch.
