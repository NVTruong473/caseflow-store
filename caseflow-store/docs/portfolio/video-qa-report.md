# Portfolio Video QA Report

## Result

`PASS` for the CaseFlow Books v1.18.3 portfolio media package shipped with the
v1.18.4 runtime patch.

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
| Audio | PASS - AAC, 48 kHz stereo |
| Duration | PASS - 214.017 seconds |
| File size | PASS - approximately 8.2 MB |
| Captions | PASS - Vietnamese SRT, 37 cues |
| Narration tail | PASS - 0.7 seconds for every scene |
| Mid-video silence | PASS - no interval at or above 1.2 seconds |
| Loudness | PASS - integrated `-19.2 LUFS`, LRA `2.8 LU`, true peak `-4.6 dBFS` |
| Background score | PASS - original 96 BPM procedural composition, no samples |
| Speech priority | PASS - music sidechain-ducked beneath narration |
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
- No third-party music or samples, stock footage, testimonials, logos, ratings,
  or business statistics were added.

## Known Limitation

Automated visual and media checks cannot prove pronunciation quality for every
Vietnamese proper noun or replace a final listening pass by the project owner.
The separate SRT is the canonical accessible transcript.
