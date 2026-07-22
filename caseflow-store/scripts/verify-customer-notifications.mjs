import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const artifactId = process.env.NOTIFICATION_ARTIFACT_ID ?? "notify-t05";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "customer-notification-check.json");

const files = await Promise.all(
  [
    "src/app/api/customer/notifications/route.ts",
    "src/app/api/customer/phone-verification/request/route.ts",
    "src/app/api/customer/phone-verification/verify/route.ts",
    "src/features/customer/customer-notification-center.tsx",
    "src/lib/auth/customer.ts",
    "src/lib/notifications/phone-verification.ts",
    "src/lib/repositories/supabase-notifications.ts",
    "supabase/migrations/0012_transactional_notifications.sql",
  ].map(async (file) => [file, await fs.readFile(path.join(ROOT, file), "utf8")]),
);
const source = Object.fromEntries(files);
const joined = Object.values(source).join("\n");

const checks = {
  accountScopedInbox:
    /eq\("customer_id", customerId\)/.test(
      source["src/lib/repositories/supabase-notifications.ts"],
    ) &&
    /customer_notifications_read_own[\s\S]*auth\.uid\(\)/.test(
      source["supabase/migrations/0012_transactional_notifications.sql"],
    ),
  authenticatedCustomerApis:
    (joined.match(/Customer authentication required/g)?.length ?? 0) >= 3 &&
    (joined.match(/Customer role required/g)?.length ?? 0) >= 3,
  inboxStatesCovered:
    /"loading" \| "ready" \| "error"/.test(
      source["src/features/customer/customer-notification-center.tsx"],
    ) && /copy\.empty/.test(source["src/features/customer/customer-notification-center.tsx"]),
  markReadBounded:
    /notificationIds: z\.array\(z\.string\(\)\.uuid\(\)\)\.min\(1\)\.max\(100\)/.test(
      await fs.readFile(path.join(ROOT, "src/lib/validation/notifications.ts"), "utf8"),
    ),
  noOtpInApiResponse:
    !/apiSuccess\([^\n]*(?:code|otp)/i.test(
      source["src/app/api/customer/phone-verification/request/route.ts"],
    ),
  otpHmacOnly:
    /createHmac\("sha256"/.test(
      source["src/lib/notifications/phone-verification.ts"],
    ) &&
    /otp_hash text not null/.test(
      source["supabase/migrations/0012_transactional_notifications.sql"],
    ),
  otpRateAndAttemptLimits:
    /recent_count >= 3/.test(source["supabase/migrations/0012_transactional_notifications.sql"]) &&
    /max_attempts integer not null default 5/.test(
      source["supabase/migrations/0012_transactional_notifications.sql"],
    ),
  phoneChangeClearsVerification:
    /phone_verified_at:[\s\S]*currentProfile\?\.phone\?\.trim\(\) === options\.profile\.phone\.trim\(\)[\s\S]*: null/.test(
      source["src/lib/auth/customer.ts"],
    ),
  phoneStatusInIdentity:
    /phoneVerified: boolean/.test(source["src/lib/auth/customer.ts"]) &&
    /phoneVerifiedAt: string \| null/.test(source["src/lib/auth/customer.ts"]),
  smsCustomerControlIsLiveOnly:
    /config\.mode === "live"/.test(
      source["src/lib/notifications/phone-verification.ts"],
    ) &&
    /inbox\?\.smsVerificationAvailable/.test(
      source["src/features/customer/customer-notification-center.tsx"],
    ),
  unmountSafeFetchState:
    /new AbortController\(\)/.test(
      source["src/features/customer/customer-notification-center.tsx"],
    ) &&
    /return \(\) => controller\.abort\(\)/.test(
      source["src/features/customer/customer-notification-center.tsx"],
    ),
  verificationRpcIsAtomic:
    /verify_phone_challenge[\s\S]*for update[\s\S]*update public\.profiles[\s\S]*insert into public\.customer_notifications/i.test(
      source["supabase/migrations/0012_transactional_notifications.sql"],
    ),
};

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  checkedAt: new Date().toISOString(),
  checks,
  failures,
  ok: failures.length === 0,
};

await fs.mkdir(artifactDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  throw new Error(`Customer notification verification failed: ${failures.join(", ")}`);
}

console.log(JSON.stringify(report, null, 2));
