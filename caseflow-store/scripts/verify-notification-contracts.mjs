import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const artifactId = process.env.NOTIFICATION_ARTIFACT_ID ?? "notify-t02";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "notification-contract-check.json");

const [types, schemas, config, envExample] = await Promise.all([
  fs.readFile(path.join(ROOT, "src/types/notifications.ts"), "utf8"),
  fs.readFile(path.join(ROOT, "src/lib/validation/notifications.ts"), "utf8"),
  fs.readFile(path.join(ROOT, "src/lib/notifications/config.ts"), "utf8"),
  fs.readFile(path.join(ROOT, ".env.example"), "utf8"),
]);

const checks = {
  channelsDefined: /"in-app", "email", "sms"/.test(types),
  externalProviderBoundary: /interface NotificationProvider/.test(types),
  idempotentEventKey: /notificationEventKeySchema/.test(schemas),
  liveModeFailClosed:
    /mode === "live"/.test(config) && /config\.issues\.push/.test(config),
  noPublicSecrets:
    !/NEXT_PUBLIC_(?:RESEND|TWILIO|OTP|NOTIFICATION)/.test(config + envExample),
  otpIsSixDigits: /\\d\{6\}/.test(schemas),
  placeholderSecretsRejected: /PLACEHOLDER_VALUES/.test(config),
  productionDefaultsDisabled:
    /return parsed\.success \? parsed\.data : "disabled"/.test(config),
  requiredEnvironmentDocumented:
    /NOTIFICATION_MODE=disabled/.test(envExample) &&
    /RESEND_API_KEY=/.test(envExample) &&
    /TWILIO_AUTH_TOKEN=/.test(envExample) &&
    /OTP_HASH_SECRET=/.test(envExample),
  dispatchSecretServerOnly:
    /NOTIFICATION_DISPATCH_SECRET=/.test(envExample) &&
    !/NEXT_PUBLIC_NOTIFICATION_DISPATCH_SECRET/.test(envExample + config),
  statusesDefined: /"queued"[\s\S]*"processing"[\s\S]*"sent"[\s\S]*"blocked"[\s\S]*"failed"/.test(
    types,
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
  throw new Error(`Notification contract verification failed: ${failures.join(", ")}`);
}

console.log(JSON.stringify(report, null, 2));
