import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const migrationPath = path.join(
  ROOT,
  "supabase/migrations/0012_transactional_notifications.sql",
);
const lifecycleMigrationPath = path.join(
  ROOT,
  "supabase/migrations/0013_notification_order_lifecycle.sql",
);
const artifactId = process.env.NOTIFICATION_ARTIFACT_ID ?? "notify-t03";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "notification-migration-check.json");
const migration = await fs.readFile(migrationPath, "utf8");
const lifecycleMigration = await fs.readFile(lifecycleMigrationPath, "utf8");
const migrationSet = `${migration}\n${lifecycleMigration}`;

const checks = {
  additiveOnly:
    !/\b(?:drop table|truncate|delete from|update public\.orders)\b/i.test(
      migrationSet,
    ),
  beginCommit:
    /^begin;[\s\S]*commit;\s*$/im.test(migration) &&
    /^begin;[\s\S]*commit;\s*$/im.test(lifecycleMigration),
  customerInboxRls:
    /customer_notifications_read_own[\s\S]*customer_id = auth\.uid\(\)/i.test(
      migration,
    ),
  concurrentClaimSafe:
    /claim_notification_outbox[\s\S]*for update skip locked/i.test(migration) &&
    /grant execute on function public\.claim_notification_outbox\(integer\) to service_role/i.test(
      migration,
    ),
  deterministicOrderTrigger:
    /orders_enqueue_notification_events[\s\S]*after insert or update of status, payment_status, shipping_status/i.test(
      migration,
    ),
  idempotencyConstraint:
    /unique \(event_key, channel\)/i.test(migration) &&
    /on conflict \(event_key, channel\) do nothing/i.test(migration),
  noDirectOtpAccess:
    /revoke all on public\.phone_verification_challenges from anon, authenticated/i.test(
      migration,
    ),
  noPlaintextOtpColumn:
    /otp_hash text not null/i.test(migration) && !/\botp_code\b/i.test(migration),
  orderCleanupPreservesNotificationHistory:
    (lifecycleMigration.match(/on delete set null/gi)?.length ?? 0) === 2 &&
    /notification_outbox_order_id_fkey/.test(lifecycleMigration) &&
    /customer_notifications_order_id_fkey/.test(lifecycleMigration),
  otpRpcIsHashedAndRateLimited:
    /create_phone_verification_challenge[\s\S]*recent_count >= 3/i.test(migration) &&
    /verify_phone_challenge[\s\S]*challenge\.otp_hash <> p_otp_hash/i.test(migration) &&
    !/p_otp_code/i.test(migration),
  outboxTable: /create table if not exists public\.notification_outbox/i.test(
    migration,
  ),
  readRpcIsAccountScoped:
    /mark_customer_notifications_read[\s\S]*customer_id = auth\.uid\(\)/i.test(
      migration,
    ),
  serviceRoleOwnsWrites:
    /grant select, insert, update, delete on public\.notification_outbox to service_role/i.test(
      migration,
    ),
  threeTables:
    /create table if not exists public\.customer_notifications/i.test(migration) &&
    /create table if not exists public\.phone_verification_challenges/i.test(
      migration,
    ),
};

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  checkedAt: new Date().toISOString(),
  checks,
  failures,
  migrations: [
    path.relative(ROOT, migrationPath),
    path.relative(ROOT, lifecycleMigrationPath),
  ],
  ok: failures.length === 0,
};

await fs.mkdir(artifactDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  throw new Error(`Notification migration verification failed: ${failures.join(", ")}`);
}

console.log(JSON.stringify(report, null, 2));
