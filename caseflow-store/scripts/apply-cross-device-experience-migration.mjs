import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pg from "pg";

const { Client } = pg;
const root = process.cwd();
const migrationPath = path.join(
  root,
  "supabase/migrations/0014_cross_device_checkout_experience.sql",
);
const artifactDirectory = path.join(
  root,
  ".agent/artifacts/qr-xdevice-t02",
);
const reportPath = path.join(
  artifactDirectory,
  "cross-device-experience-migration-apply-check.json",
);
const connectionString = process.env.SUPABASE_DB_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const applyRequested =
  process.env.CROSS_DEVICE_EXPERIENCE_MIGRATION_APPLY === "true";

if (!connectionString) {
  throw new Error("SUPABASE_DB_URL is required");
}

const migration = await fs.readFile(migrationPath, "utf8");
const migrationSha256 = crypto
  .createHash("sha256")
  .update(migration)
  .digest("hex");
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
    commerceCountsPreserved:
      before.orderCount === after.orderCount &&
      before.orderItemCount === after.orderItemCount &&
      before.paymentCount === after.paymentCount &&
      before.voucherCount === after.voucherCount,
    completionRpcReady: after.completionRpcReady,
    expectedColumnsReady: after.expectedColumnCount === 16,
    noAnonAuthenticatedGrants: after.publicGrantCount === 0,
    rlsReady: after.rlsReady,
    tableReady: after.tableReady,
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
    migration: path.relative(root, migrationPath),
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

async function inspectDatabase(client) {
  const result = await client.query(`
    select
      (select count(*)::integer from public.orders) as order_count,
      (select count(*)::integer from public.order_items) as order_item_count,
      (select count(*)::integer from public.payments) as payment_count,
      (select count(*)::integer from public.customer_promotion_vouchers) as voucher_count,
      to_regclass('public.checkout_experience_sessions') is not null as table_ready,
      (
        select count(*)::integer
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'checkout_experience_sessions'
      ) as expected_column_count,
      coalesce((
        select relrowsecurity
        from pg_class
        join pg_namespace on pg_namespace.oid = pg_class.relnamespace
        where pg_namespace.nspname = 'public'
          and pg_class.relname = 'checkout_experience_sessions'
      ), false) as rls_ready,
      exists (
        select 1
        from pg_proc
        join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
        where pg_namespace.nspname = 'public'
          and pg_proc.proname = 'complete_checkout_experience_session'
      ) as completion_rpc_ready,
      (
        select count(*)::integer
        from information_schema.role_table_grants
        where table_schema = 'public'
          and table_name = 'checkout_experience_sessions'
          and grantee in ('anon', 'authenticated', 'PUBLIC')
      ) as public_grant_count
  `);
  const row = result.rows[0];

  return {
    completionRpcReady: row.completion_rpc_ready,
    expectedColumnCount: row.expected_column_count,
    orderCount: row.order_count,
    orderItemCount: row.order_item_count,
    paymentCount: row.payment_count,
    publicGrantCount: row.public_grant_count,
    rlsReady: row.rls_ready,
    tableReady: row.table_ready,
    voucherCount: row.voucher_count,
  };
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
    candidates.push({
      connectionString: poolerUrl.toString(),
      mode: "session-pooler",
    });
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

  throw new Error(
    `Database connection failed through ${failures.length} configured paths`,
  );
}
