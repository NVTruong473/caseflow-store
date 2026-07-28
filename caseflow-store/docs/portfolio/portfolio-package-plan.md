# PORTFOLIO-T01 - Verified Portfolio And Case Study Package

- Status: Completed
- Date: 2026-07-28
- Production target: `https://caseflow-store.vercel.app`
- Released baseline: `v1.17.0`

## Objective

Turn the verified showroom into a concise portfolio package that a recruiter,
technical reviewer, or prospective source-code buyer can understand in five
minutes without inflating the product scope.

This is a documentation and evidence task. It does not reopen feature
development, change Production behavior, add a website runtime dependency, or
claim real payment/logistics operations.

## Deliverables

1. A 3-5 minute Vietnamese walkthrough video with:
   - actual Production storefront footage;
   - catalog and product discovery;
   - isolated Buy Now checkout;
   - QR checkout experience boundary;
   - official order creation and customer order history;
   - admin dashboard/order operations;
   - a concise layer-architecture explanation;
   - an audio stream and Vietnamese subtitle file.
2. A curated desktop/mobile screenshot set.
3. A recruiter-facing case study.
4. A customer/staff/admin feature matrix.
5. Verified CV bullets and an interview preparation guide.
6. A claim-to-evidence index.
7. README links that make the package discoverable.
8. A machine-readable capture/render/QA report.

## Video Pipeline

The local `codex-video-wizard-complete` project is used as a process reference
for storyboard, free FFmpeg fallback, subtitle, stream, rights, and QA gates.
The website repository keeps its own reproducible capture/render scripts.

The selected pipeline is:

```text
Production website
  -> Playwright-controlled customer/admin recordings
  -> temporary confirmed customer and cleaned order data
  -> local title/architecture cards
  -> Edge TTS Vietnamese narration
  -> FFmpeg scene normalization and composition
  -> MP4 + SRT + thumbnail + QA report
```

No external commercial footage, music, customer data, admin password, provider
secret, or paid generation credit may enter the output.

## Acceptance Criteria

### Evidence integrity

- Every product or engineering claim links to source, release notes, tests, or
  QA evidence.
- No fabricated user count, conversion metric, testimonial, award, revenue,
  uptime, customer logo, or live-provider claim.
- The video states that QR is an isolated experience and not real settlement.
- Temporary customer/order data is removed after capture.

### Video

- Duration is between 180 and 300 seconds.
- Resolution is at least 1280x720.
- MP4 contains one video stream and one audio stream.
- Vietnamese SRT exists and covers every narration scene.
- No secret, password field content, real customer email, or real payment
  credential is visible.
- Production UI footage has no captured console/page error.
- Title, customer journey, operations, architecture, and closing scenes exist.
- Audio is intelligible and does not clip.
- Final metadata does not expose local usernames or temporary tool paths.

### Documentation

- Case study explains problem, constraints, architecture, implementation,
  security, testing, tradeoffs, and honest boundaries.
- Role matrix separates customer, staff, admin, and server-owned authority.
- CV bullets use only verified numbers.
- Interview guide includes likely architecture, security, testing, and
  tradeoff questions.
- README exposes the demo video and portfolio index without replacing the
  technical setup documentation.

### Verification

- Capture report: PASS.
- `ffprobe` stream/duration/resolution gate: PASS.
- Subtitle timing/coverage gate: PASS.
- Screenshot dimensions and readability gate: PASS.
- Secret scan on portfolio outputs: PASS.
- `git diff --check`: PASS.
- Existing architecture verifier: PASS.

## Boundaries

- The generated narration uses a synthetic Vietnamese system voice and is
  documented as such.
- The walkthrough is evidence for the released showroom, not proof of real
  business traction.
- The public website remains a proprietary-source portfolio/showroom.
- No new release tag or Production deployment is required for documentation
  assets alone.

## Completion Evidence

- Production capture: PASS; customer order, cross-device QR practice, order
  history, and admin status update completed with zero collected console/page
  errors.
- Cleanup: PASS; zero temporary auth users, profiles, orders, catalog,
  inventory, promotion, or legacy QA records.
- Final media: PASS; 256.322-second H.264/AAC MP4 at 1280x720, 37 Vietnamese
  subtitle cues, approximately 7.7 MB.
- Visual review: PASS; customer/admin frames and 14 desktop/mobile screenshots
  checked without observed clipping or horizontal overflow.
- Privacy scan: PASS; no customer email, Gmail address, secret, JWT, local user
  path, or admin password value in retained artifact text.
- Architecture: PASS; 248 checked files and zero findings.
- Lint, TypeScript, package verifier, and `git diff --check`: PASS.
- Runtime/Production behavior: unchanged; no deployment or release tag required.
