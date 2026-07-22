import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pg from "pg";

const { Client } = pg;
const ROOT = process.cwd();
const MIGRATION_PATH = path.join(
  ROOT,
  "supabase/migrations/0011_atomic_idempotent_book_orders.sql",
);
const artifactId =
  process.env.ORDER_RELIABILITY_ARTIFACT_ID ?? "order-reliability-t05";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "migration-apply-check.json");
const connectionString = process.env.SUPABASE_DB_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required");
}

const migration = await fs.readFile(MIGRATION_PATH, "utf8");
const migrationSha256 = crypto
  .createHash("sha256")
  .update(migration)
  .digest("hex");
const applyRequested = process.env.ORDER_RELIABILITY_APPLY === "true";
const { client, connectionMode } = await connectDatabase({
  connectionString,
  projectRef,
});

try {
  const before = await inspectDatabase(client);

  if (applyRequested) {
    await client.query(migration);
  }

  const after = await inspectDatabase(client);
  const checks = {
    additiveOnlyCountsPreserved:
      before.orderCount === after.orderCount &&
      before.orderItemCount === after.orderItemCount &&
      before.voucherCount === after.voucherCount,
    attemptColumnReady: after.attemptColumnExists,
    attemptIndexReady: after.attemptIndexExists,
    orderVoucherHistoryRestricted: after.orderVoucherHistoryRestricted,
    releasedRpcRetained: after.releasedRpcExists,
    versionedRpcReady: after.versionedRpcExists,
  };
  const expectedReady = applyRequested;
  const ok = expectedReady
    ? Object.values(checks).every(Boolean)
    : checks.releasedRpcRetained;
  const report = {
    after,
    applyRequested,
    before,
    checkedAt: new Date().toISOString(),
    checks,
    connectionMode,
    migration: path.relative(ROOT, MIGRATION_PATH),
    migrationSha256,
    ok,
  };

  await fs.mkdir(artifactDirectory, { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
} finally {
  await client.end();
}

async function connectDatabase({ connectionString, projectRef }) {
  const candidates = [];

  if (projectRef) {
    const poolerUrl = new URL(connectionString);
    poolerUrl.hostname =
      process.env.SUPABASE_DB_POOLER_HOST ??
      "aws-0-ap-southeast-1.pooler.supabase.com";
    poolerUrl.port = "5432";
    poolerUrl.username = `postgres.${projectRef}`;
    candidates.push({
      connectionString: poolerUrl.toString(),
      mode: "session-pooler",
    });
  }

  candidates.push({ connectionString, mode: "direct" });
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

  throw new Error(
    `Database connection failed through ${failures.length} configured paths`,
  );
}

async function inspectDatabase(client) {
  const countsResult = await client.query(`
        select
          (select count(*)::integer from public.orders) as order_count,
          (select count(*)::integer from public.order_items) as order_item_count,
          (select count(*)::integer from public.customer_promotion_vouchers) as voucher_count
      `);
  const columnResult = await client.query(`
        select exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'orders'
            and column_name = 'checkout_attempt_id'
            and data_type = 'uuid'
        ) as exists
      `);
  const indexResult = await client.query(`
        select exists (
          select 1
          from pg_indexes
          where schemaname = 'public'
            and indexname = 'orders_customer_checkout_attempt_unique_idx'
        ) as exists
      `);
  const functionResult = await client.query(`
        select
          to_regprocedure('public.create_book_order_with_items(text,uuid,text,text,text,jsonb,text,text,integer,integer,integer,integer,jsonb,jsonb,jsonb,text,jsonb)') is not null as released_rpc_exists,
          to_regprocedure('public.create_book_order_with_items_v2(uuid,text,uuid,text,text,text,jsonb,text,text,integer,integer,integer,integer,jsonb,jsonb,jsonb,text,jsonb)') is not null as versioned_rpc_exists
      `);
  const voucherForeignKeyResult = await client.query(`
        select coalesce(
          (
            select confdeltype = 'r'
            from pg_constraint
            where conname = 'customer_promotion_vouchers_used_order_id_fkey'
              and conrelid = 'public.customer_promotion_vouchers'::regclass
          ),
          false
        ) as restricted
      `);
  const counts = countsResult.rows[0];
  const functions = functionResult.rows[0];

  return {
    attemptColumnExists: columnResult.rows[0].exists,
    attemptIndexExists: indexResult.rows[0].exists,
    orderCount: counts.order_count,
    orderItemCount: counts.order_item_count,
    orderVoucherHistoryRestricted:
      voucherForeignKeyResult.rows[0].restricted,
    releasedRpcExists: functions.released_rpc_exists,
    versionedRpcExists: functions.versioned_rpc_exists,
    voucherCount: counts.voucher_count,
  };
}
