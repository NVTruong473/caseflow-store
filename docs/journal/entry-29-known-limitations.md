# Entry 29 - Known Limitations

Type: retrospective note, not an additional development day.

## Main Limits

The `v1.0.0` release is a small e-commerce MVP, not a full commerce platform. It uses simulated checkout, not a real payment gateway. It validates stock but does not implement a full inventory decrement or reservation workflow. Product management is seeded/admin-limited rather than a full catalog CMS.

The cart is localStorage-based and does not sync across devices. There is no coupon engine, review system, wishlist, shipping integration, email notification, analytics dashboard, or real product image management.

The dependency audit has no high or critical issues, but two moderate advisories remain accepted because the suggested forced fix would downgrade Next.js inappropriately.

## Why This Is Acceptable

These limitations are documented with impact, current control, and next step. They are not hidden behind inflated portfolio claims.

## Next Evolution

For the CaseFlow Books direction, the next roadmap should decide which limitations to address first instead of adding broad features without operational depth.
