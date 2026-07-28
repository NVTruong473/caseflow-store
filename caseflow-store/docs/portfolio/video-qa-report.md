# Portfolio Video QA Report

## Result

`PASS` for the CaseFlow Books v1.17.0 portfolio media package.

## Capture

| Check | Result | Evidence |
|---|---|---|
| Production target | PASS | `https://caseflow-store.vercel.app` |
| Customer order created | PASS | `capture-report.json` |
| Cross-device QR practice completed | PASS | Desktop and mobile screenshots |
| Customer order history rendered | PASS | Desktop/mobile order screenshots |
| Admin found and updated order | PASS | Admin detail/confirmed screenshots |
| Console/page errors | PASS | `0` collected |
| Temporary data removed | PASS | Capture report and cleanup verifier |

## Media

| Check | Result |
|---|---|
| Container | PASS - MP4 |
| Video | PASS - H.264, 1280x720, 30 fps |
| Audio | PASS - AAC, 48 kHz mono |
| Duration | PASS - 256.322 seconds |
| File size | PASS - approximately 7.4 MB |
| Captions | PASS - Vietnamese SRT, 37 cues |
| Loudness sanity | PASS - mean `-21.1 dB`, maximum `-2.6 dB` |
| Embedded source metadata | PASS - inherited metadata removed; only normal encoder/container fields remain |

## Visual Review

Frames were extracted from the final MP4 in customer and admin chapters and
inspected at original 1280x720 resolution.

- No horizontal overflow, clipped navigation, or overlapping controls observed.
- Cover art, pricing, chapter overlays, and operational navigation remain
  legible.
- Mobile source screenshots are 390x844 and preserve readable QR/order layouts.
- Title, architecture, and outro cards use the same product palette and stable
  16:9 framing.

## Privacy And Honesty

- No real customer identity, address, email, phone, password, bank credential,
  API key, or service-role secret is shown.
- The QR practice scene is described as non-settlement and non-mutating.
- Synthetic narration is disclosed by voice and engine.
- No music, stock footage, testimonials, logos, ratings, or business statistics
  were added.

## Known Limitation

Automated visual and media checks cannot prove pronunciation quality for every
Vietnamese proper noun. The separate SRT is the canonical accessible transcript.
