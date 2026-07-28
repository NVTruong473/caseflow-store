# Originkit Commerce Motion Audit

- Task: `ORIGINKIT-T01`
- Date: 2026-07-28
- Status: accepted
- Decision record:
  `docs/adr/0023-bounded-originkit-commerce-motion.md`

## Evaluation Standard

An effect is not accepted because it looks impressive in isolation. It must
improve a real bookstore task, preserve immediate readability, work with
keyboard and touch input, respect reduced motion, avoid layout shift, and stay
cheap enough for repeated product browsing.

## Catalog Findings

| Originkit pattern | Bookstore fit | Decision | Reason |
|---|---:|---|---|
| Image Magnifier | High | Adapt | Helps inspect typography and artwork on a real cover |
| Hover Image Reveal | High after adaptation | Adapt | Gives text-led categories a visual book anchor |
| Image Spotlight | Low | Reject | Dark veil hides the product until pointer interaction |
| Scroll Text Highlight | Low | Reject | GSAP dependency and scroll-coupled reading |
| Text Lift / Stagger Text Rise | Low | Reject | Per-letter motion weakens bilingual readability |
| Image Fold | Low | Reject | Shader/3D cost exceeds its commerce value |
| Coverflow/Gravity/Swipe galleries | Medium-low | Reject | Compete with predictable catalog navigation |
| Cursor/particle/background effects | None | Reject | Decorative, continuous, and distracting |
| Magnetic/emoji/button effects | None | Reject | Makes primary commerce actions less predictable |

## Selected Adaptations

### Product-detail cover magnifier

- Existing weakness: the primary cover is visually strong but cannot be
  inspected beyond its rendered size.
- Correction: add a bounded lens over the existing local cover for fine
  pointers.
- Guardrails: no hidden cursor, no canvas, no remote URL, no touch requirement,
  no movement under reduced-motion.

### Category cover reveal

- Existing weakness: the homepage category rail is useful but mostly text and
  colored spine strips, so real cover color is absent from that discovery
  moment.
- Correction: attach one representative local cover to each live category and
  reveal it within a fixed card region.
- Guardrails: keyboard focus parity, stable card dimensions, no cursor-following
  overlay, and static touch fallback.

## 95% Confidence Rationale

The selected effects are bounded to two high-value locations, use content the
customer is already evaluating, add no dependency, and fail back to the current
complete experience. The rejected effects fail at least one critical commerce
dimension: reading speed, interaction predictability, mobile parity,
performance, or maintainability.

The 95% confidence gate is passed. `ORIGINKIT-T03` verified both adaptations
at desktop, tablet, touch, keyboard-focus, and reduced-motion conditions with
stable geometry and no horizontal overflow. `ORIGINKIT-T04` then passed lint,
TypeScript, the 66-route Production build, focused Playwright `3/3`,
architecture verification, runtime dependency audit, and post-test cleanup.

The deliberately narrow scope is part of that confidence: these effects help
customers inspect or discover real books, while the rejected effects would add
motion without improving a commerce task. Production remains unchanged until a
separate release task is approved.
