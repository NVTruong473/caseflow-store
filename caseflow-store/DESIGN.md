---
name: CaseFlow Store Design System
version: 0.1.0
status: draft
project: CaseFlow Store
purpose: Keep UI decisions stable across AI coding sessions
tokens:
  colors:
    background: "#F8FAFC"
    surface: "#FFFFFF"
    surfaceMuted: "#F1F5F9"
    text: "#111827"
    textMuted: "#64748B"
    border: "#CBD5E1"
    primary: "#2563EB"
    primaryHover: "#1D4ED8"
    accent: "#F59E0B"
    success: "#15803D"
    warning: "#B45309"
    error: "#DC2626"
  radius:
    sm: "4px"
    md: "8px"
    lg: "12px"
  spacing:
    xs: "4px"
    sm: "8px"
    md: "16px"
    lg: "24px"
    xl: "32px"
    "2xl": "48px"
  typography:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    bodySize: "16px"
    smallSize: "14px"
    h1Size: "40px"
    h2Size: "28px"
    h3Size: "20px"
---

# CaseFlow Store Design System

## Design Goal

CaseFlow Store should feel like a practical small e-commerce product, not a decorative landing page. The UI should be clear, responsive, fast to scan, and useful for demonstrating full-stack engineering quality.

## Visual Direction

- Clean, commerce-focused, and workmanlike.
- Mobile-first with a strong desktop layout.
- Product images and product data are the main visual signal.
- Avoid overly decorative gradients, floating blobs, oversized hero cards, or animation-heavy UI.
- Use restrained polish: consistent spacing, clear hierarchy, good focus states, and stable layouts.

## Layout Rules

- Mobile baseline: `375px`.
- Desktop baseline: `1440px`.
- Main content should use a constrained max width.
- Product grid must not overflow horizontally.
- Product image containers must use a stable aspect ratio, preferably `1 / 1`.
- Do not place cards inside cards.
- Use cards only for repeated product/order items, modals, and framed tools.
- Admin table on mobile should become compact cards or intentional horizontal scroll.

## Component Rules

### Buttons

- Primary action: blue background, white text.
- Secondary action: white background, border.
- Destructive action: error color.
- Every button must have hover, focus, disabled, and loading states when relevant.
- Icon buttons need accessible labels.

### Inputs

- Every input must have a visible label.
- Error text must be close to the input.
- Invalid fields must be identifiable without relying on color alone.

### Product Cards

- Image first, then name, price, category, and action.
- Product cards must remain stable when loading images.
- Do not put long marketing copy inside product cards.

### Cart Drawer

- Must be keyboard usable.
- Must have a clear close button.
- Empty cart state must be explicit.
- Quantity controls must prevent invalid values.

### Admin UI

- Dense but readable.
- Prioritize status, customer, total, and created date.
- Avoid dashboard decoration until the order workflow is complete.

## Accessibility Rules

- Use semantic buttons and links.
- Use labels for all form fields.
- Use focus-visible styles.
- Do not use color as the only status indicator.
- Prefer Playwright selectors by role, label, or accessible name.

## Implementation Rules

- Map tokens into `src/app/globals.css` when the app exists.
- Components should use shared tokens or Tailwind theme values, not random one-off colors.
- Read this file before changing component colors, typography, radius, spacing, or layout.
