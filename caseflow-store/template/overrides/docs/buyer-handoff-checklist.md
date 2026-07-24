# Buyer Handoff Checklist

## Ownership

- [ ] Buyer owns the private source repository.
- [ ] Buyer owns Supabase, Vercel, domain, DNS, and provider accounts.
- [ ] Source license and support scope are signed.
- [ ] No showroom credential, project ID, database, or deployment is reused.

## Identity And Content

- [ ] Brand, logo, colors, canonical URL, support channels, and legal display
      name are approved.
- [ ] Catalog import has source, price, stock, image-rights, and rollback
      evidence.
- [ ] Privacy, terms, delivery, payment, and return policies are supplied or
      approved by the buyer.

## Security And Operations

- [ ] Production secrets are stored only in approved secret managers.
- [ ] RLS, roles, server totals, idempotency, rate limits, and webhook
      verification are tested.
- [ ] Backup, restore, incident, access revocation, and deployment rollback are
      rehearsed.
- [ ] Mock payment completion is unavailable in Production.

## Acceptance

- [ ] Lint, TypeScript, build, migration, security, responsive, accessibility,
      and buyer-isolated Playwright gates pass.
- [ ] Customer, staff, and admin UAT pass using buyer-owned test accounts.
- [ ] Data reconciliation and launch rollback criteria are signed off.
