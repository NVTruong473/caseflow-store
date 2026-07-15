# Pre-Implementation Review

## Review Goal

Assess whether the project plan is ready to begin from zero, identify remaining gaps, and define mitigation before app implementation starts.

## Current Readiness

Status: almost ready, but blocked by user confirmation and environment verification.

The documentation foundation is ready. The application itself has not been initialized, which is intentional.

## Useful Knowledge Captured From The Planning Chat

- Keep the project as a small MVP.
- Use a Next.js modular monolith to avoid unnecessary frontend/backend split.
- Use mock-first development so UI can be tested before Supabase is ready.
- Use Supabase for database and admin auth.
- Use localStorage for guest cart, but only store `productId` and `quantity`.
- Never trust price or subtotal from the browser.
- Protect admin APIs server-side.
- Deploy early, not only on Day 19.
- Add `DESIGN.md` for consistent AI-generated UI.
- Add ADRs so architecture decisions are explainable during interviews.
- Use 20 real implementation days and 10 retrospective entries.

## Remaining Gaps

### G-01: Product domain was still an assumption

Risk: schema, categories, copy, images, and filters may change later.

Resolution:

- Resolved on 2026-07-14 through user-delegated selection.
- Product domain: phone accessories.
- Domain-specific feature: phone-model compatibility filtering.
- Details are recorded in `docs/domain.md`.

### G-02: Local environment is not verified

Risk: Next.js initialization may fail.

Mitigation:

- First implementation task must run:

```bash
node -v
npm -v
npx --version
git --version
```

### G-03: Supabase and Vercel access is unknown

Risk: integration and deployment may slip.

Mitigation:

- Smoke deploy by Day 2-3 if possible.
- Supabase proof of connection by Day 3.
- Do not wait until Day 19 for first deploy.

### G-04: Order transaction complexity

Risk: partial order creation or inconsistent stock.

Mitigation:

- Prefer transaction/RPC when creating orders.
- If stock decrement is not implemented safely, document it as a known MVP limitation.
- Never implement partial stock decrement that can leave broken orders.

### G-05: Documentation can delay product delivery

Risk: the project becomes a documentation exercise.

Mitigation:

- Keep docs short and decision-focused.
- Once implementation starts, documentation updates should be tied to tasks.
- Do not create more architecture docs unless they clarify a real implementation decision.

### G-06: Generic tutorial-clone risk

Risk: a basic product/cart/checkout demo may not stand out.

Mitigation:

- Add phone compatibility filter.
- Include server-side price validation.
- Include admin authorization tests.
- Include E2E checkout evidence.
- Include architecture and ADRs explaining trade-offs.

### G-07: Public demo abuse and privacy

Risk: public visitors enter real personal data or spam orders.

Mitigation:

- Add demo notice.
- Limit input length.
- Add honeypot or simple abuse control.
- Provide cleanup plan for demo orders.
- Do not collect payment data.

## Final Readiness Checklist Before Implementation

- [ ] User confirms implementation can begin.
- [x] Product domain confirmed or default accepted.
- [ ] Node.js version verified.
- [ ] npm/npx verified.
- [ ] Git verified.
- [ ] Decision accepted: Next.js modular monolith.
- [ ] Decision accepted: Supabase.
- [ ] Decision accepted: simulated checkout.
- [ ] Decision accepted: guest cart in localStorage.
- [ ] Day 1 task starts with environment preflight.

## Feasibility Assessment

Feasibility: high if scope stays frozen and early deploy checks happen.

Main reasons:

- Stack is suitable for a one-person 20-day MVP.
- Mock-first workflow reduces integration blocking.
- Documentation now preserves context across sessions.
- Risk controls are defined before implementation.

Main threats:

- Adding real payment, reviews, wishlist, chat, or analytics.
- Delaying deploy until the end.
- Treating Supabase auth/RLS as easy without testing.
- Spending too much time on visual polish.
- Faking journal entries or test evidence.

## Expected Final Outcome

If executed according to this plan, the final project should include:

- Public production URL.
- Responsive e-commerce storefront.
- Product listing, detail, search/filter, and cart.
- Guest checkout with server-side validation.
- Orders stored in Supabase.
- Admin login and order management.
- Server-side price calculation.
- RLS/auth protection for admin data.
- E2E happy path test.
- README with setup and deployment instructions.
- Architecture docs and ADRs.
- Known limitations.
- Honest 20-day implementation journal plus 10 retrospective entries.
- CV-ready project summary backed by real evidence.

## Start Condition

Implementation should begin only after the user explicitly confirms:

```text
Tôi xác nhận bắt đầu triển khai từ Day 1.
```
