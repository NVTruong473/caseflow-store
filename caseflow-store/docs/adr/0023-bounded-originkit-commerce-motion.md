# ADR-0023: Bounded Originkit-Informed Commerce Motion

- Status: Accepted
- Date: 2026-07-28
- Scope: post-release storefront motion enhancement
- Planning task: `ORIGINKIT-T01`

## Context

CaseFlow Books `v1.16.0` is a verified showroom with a 500-edition catalog,
book-detail pages, checkout, account order history, and small-business
operations. Its motion system is intentionally restrained. The user approved a
new visual-polish task using Originkit as a reference, provided every effect is
appropriate for an operational bilingual bookstore and is verified before
acceptance.

Originkit currently describes itself as a beta animated-component library for
Framer, React, and AI tools through MCP. Its catalog includes image, text,
cursor, background, gallery, and interactive effects. The catalog is useful as
an interaction reference, but most showcase effects conflict with the
storefront's accessibility, performance, and commerce priorities.

The public component pages expose behavior and API descriptions. Copying source
requires an Originkit account that is not part of this repository. Therefore,
CaseFlow will implement small, original, dependency-free adaptations of the
documented interaction ideas instead of claiming to contain copied Originkit
source.

## Decision

Adopt exactly two Originkit-informed effects:

1. **Book-cover magnifier**
   - Reference: Originkit `Image Magnifier`.
   - Surface: the primary cover on a book-detail page only.
   - Behavior: a bounded lens follows a fine pointer and magnifies the same
     local cover image.
   - Adaptation: keep the system cursor visible, use no canvas, use no remote
     image, and leave the ordinary cover fully usable when the effect is
     unavailable.

2. **Category cover reveal**
   - Reference: Originkit `Hover Image Reveal`.
   - Surface: homepage category spine rail only.
   - Behavior: each category gains one catalog-backed representative cover,
     revealed inside the card on hover or keyboard focus.
   - Adaptation: do not create a cursor-following window. Keep geometry fixed
     so the rail cannot shift, overlap neighboring content, or become unusable
     on touch devices.

Both effects must use existing local, provenance-tracked cover assets and the
current token system. They must add no runtime dependency.

## Explicitly Rejected

- `Scroll Text Highlight`: requires GSAP/ScrollTrigger and makes reading depend
  on scroll progress.
- `Text Lift`, `Stagger Text Rise`, scramble, glitch, vaporize, or typewriter
  treatments: reduce immediate readability and make bilingual headings harder
  to scan.
- `Image Fold`, fluid distortion, 3D, particle, and shader effects: too costly
  for a product image and unnecessary for a commerce decision.
- Cursor trails, magnetic controls, emoji bursts, snow, stars, glowing
  backgrounds, marquees, and continuous loops: decorative motion competes with
  search, prices, stock, and checkout.
- Site-wide entrance animation: it delays access to catalog content and can
  make the showroom resemble an animation-library demo.
- Originkit MCP/API installation: no repository credential or account is
  required for the accepted dependency-free adaptations.

## Accessibility And Interaction Contract

- Core content and actions remain available with JavaScript disabled.
- Magnification is enhancement-only and never hides the original cover.
- The lens is disabled for coarse pointers, non-hover devices, and
  `prefers-reduced-motion: reduce`.
- Category preview is also revealed by `:focus-visible`, not hover alone.
- Touch layouts show a stable representative cover without requiring hover.
- Effects cannot change heading order, link names, focus order, hit target
  size, or book-cover alternative text.
- Motion is limited to opacity, clipping, and transform; no layout property is
  animated.

## Performance And Maintenance Contract

- No GSAP, Framer Motion, WebGL, canvas, remote script, or new npm dependency.
- No client boundary is added to catalog grids or the full homepage.
- Only the detail-page cover magnifier is a small Client Component.
- Images retain explicit responsive sizing and local paths.
- Effects use design tokens and shared CSS classes rather than scattered
  one-off values.

## Acceptance Criteria

- The product-detail lens follows the pointer within its own bounds and never
  overflows or distorts the cover.
- The category rail uses live catalog records and local cover paths.
- The category reveal works on hover and keyboard focus, and remains useful on
  touch.
- Desktop `1440px`, tablet `768px`, and mobile `375px` renders have no overlap,
  clipping, horizontal overflow, or text regression.
- Reduced-motion verification proves non-essential motion is disabled.
- Keyboard focus and semantic links remain intact.
- Lint, TypeScript, build, focused Playwright, and `git diff --check` pass.
- Existing checkout, auth, order, and admin boundaries are unchanged.

## Confidence Gate

The enhancement is accepted only when all six dimensions pass:

| Dimension | Required evidence |
|---|---|
| Product relevance | The effect helps inspect a cover or discover a category |
| Commerce clarity | Price, stock, title, and primary actions remain dominant |
| Accessibility | Focus, semantics, touch fallback, and reduced motion pass |
| Layout stability | No geometry shift, overlap, or horizontal overflow |
| Performance | No new dependency and no continuous background work |
| Maintainability | Shared component/CSS, local assets, focused tests |

Passing all six dimensions is the project's operational definition of at least
95% confidence that the selected motion belongs in CaseFlow Books.

## Consequences

Positive:

- The storefront gains a recognizable, book-specific interaction without
  becoming an animation showcase.
- Real covers contribute more color and depth to discovery.
- The implementation remains replaceable, testable, and dependency-free.

Negative:

- Fine-pointer users receive a richer detail interaction than touch users;
  touch users keep the complete static product experience.
- Originkit source updates will not automatically flow into this repository
  because the project intentionally owns the adapted implementations.
