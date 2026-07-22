import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const migrationPaths = [
  "supabase/migrations/0012_transactional_notifications.sql",
  "supabase/migrations/0013_notification_order_lifecycle.sql",
].map((migration) => path.join(ROOT, migration));
const artifactId = process.env.NOTIFICATION_ARTIFACT_ID ?? "notify-t03-preflight";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "notification-migration-apply-check.json");
const connectionString = process.env.SUPABASE_DB_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required");
}

const migrations = await Promise.all(
  migrationPaths.map(async (migrationPath) => ({
    path: migrationPath,
    sql: await fs.readFile(migrationPath, "utf8"),
  })),
);
const migrationSha256 = crypto
  .createHash("sha256")
  .update(migrations.map((migration) => migration.sql).join("\n-- next migration --\n"))
  .digest("hex");
const applyRequested = process.env.NOTIFICATION_MIGRATION_APPLY === "true";
const { client, connectionMode } = await connectDatabase({
  connectionString,
  projectRef,
});

try {
  const before = await inspectDatabase(client);

  if (applyRequested) {
    for (const migration of migrations) {
      await client.query(migration.sql);
    }
  }

  const after = await inspectDatabase(client);
  const checks = {
    commerceCountsPreserved:
      before.orderCount === after.orderCount &&
      before.orderItemCount === after.orderItemCount &&
      before.voucherCount === after.voucherCount,
    customerInboxRlsReady: after.customerInboxRlsReady,
    notificationTablesReady: after.notificationTableCount === 3,
    orderTriggerReady: after.orderTriggerReady,
    readRpcReady: after.readRpcReady,
  };
  const ok = applyRequested
    ? Object.values(checks).every(Boolean)
    : checks.commerceCountsPreserved;
  const report = {
    after,
    applyRequested,
    before,
    checkedAt: new Date().toISOString(),
    checks,
    connectionMode,
    migrations: migrations.map((migration) => path.relative(ROOT, migration.path)),
    migrationSha256,
    ok,
  };

  await fs.mkdir(artifactDirectory, { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));

  if (!ok) process.exitCode = 1;
} finally {
  await client.end();
}

async function connectDatabase({ connectionString: url, projectRef: ref }) {
  const candidates = [];

  if (ref) {
    const poolerUrl = new URL(url);
    poolerUrl.hostname =
      process.env.SUPABASE_DB_POOLER_HOST ??
      "aws-0-ap-southeast-1.pooler.supabase.com";
    poolerUrl.port = "5432";
    poolerUrl.username = `postgres.${ref}`;
    candidates.push({ connectionString: poolerUrl.toString(), mode: "session-pooler" });
  }

  candidates.push({ connectionString: url, mode: "direct" });
  const failures = [];

  for (const candidate of candidates) {
    const candidateClient = new Client({
      connectionString: candidate.connectionString,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await candidateClient.connect();
      return { client: candidateClient, connectionMode: candidate.mode };
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "unknown error");
      await candidateClient.end().catch(() => undefined);
    }
  }

  throw new Error(`Database connection failed through ${failures.length} configured paths`);
}

async function inspectDatabase(client) {
  const result = await client.query(`
    select
      (select count(*)::integer from public.orders) as order_count,
      (select count(*)::integer from public.order_items) as order_item_count,
      (select count(*)::integer from public.customer_promotion_vouchers) as voucher_count,
      (
        select count(*)::integer
        from information_schema.tables
        where table_schema = 'public'
          and table_name in (
            'notification_outbox',
            'customer_notifications',
            'phone_verification_challenges'
          )
      ) as notification_table_count,
      exists (
        select 1
        from pg_trigger
        where tgname = 'orders_enqueue_notification_events'
          and not tgisinternal
      ) as order_trigger_ready,
      exists (
        select 1
        from pg_proc
        join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
        where pg_namespace.nspname = 'public'
          and pg_proc.proname = 'mark_customer_notifications_read'
      ) as read_rpc_ready,
      exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'customer_notifications'
          and policyname = 'customer_notifications_read_own'
      ) as customer_inbox_rls_ready
  `);
  const row = result.rows[0];

  return {
    customerInboxRlsReady: row.customer_inbox_rls_ready,
    notificationTableCount: row.notification_table_count,
    orderCount: row.order_count,
    orderItemCount: row.order_item_count,
    orderTriggerReady: row.order_trigger_ready,
    readRpcReady: row.read_rpc_ready,
    voucherCount: row.voucher_count,
  };
}
