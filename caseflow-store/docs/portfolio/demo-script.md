# Demo Script And Chapters

## Timeline

| Time | Chapter | Evidence |
|---|---|---|
| `00:00-00:17` | Product context | CaseFlow Books v1.17.0 title card |
| `00:17-02:22` | Customer journey | Production storefront, discovery, Buy Now, QR practice, official order, order history |
| `02:22-03:10` | Operations | Production dashboard, order lookup, status transition |
| `03:10-03:56` | Architecture | Six-layer modular-monolith map |
| `03:56-04:16` | Evidence and boundaries | Repository, QA, and buyer handoff |

The canonical narration text and minimum scene durations are stored in
[`demo-scenes.json`](demo-scenes.json). The rendered timing and audio duration
for every scene are stored in
[`assets/demo-v1.17.0/render-report.json`](assets/demo-v1.17.0/render-report.json).

## Story Rules

- Show the deployed product before discussing architecture.
- Demonstrate both customer value and operational depth.
- State that server data owns price, stock, vouchers, and totals.
- Keep official commerce separate from QR practice.
- Never imply real settlement, business traction, or licensed commercial
  catalog rights.
- Close with inspectable source, release, QA, and buyer prerequisites.

## Capture Method

`scripts/capture-portfolio-demo.ts` records Production with Playwright at
1280x720 and captures selected mobile screens at 390x844. Authentication cookies
are installed before recording, so passwords never appear. Temporary customer,
voucher, and order rows are deleted in `finally`.

`scripts/render-portfolio-demo.mjs` generates Vietnamese narration, merges
scene captions, normalizes H.264/AAC media, removes inherited metadata, and
verifies final duration and resolution. Narration is synthetic and disclosed in
the portfolio index.
