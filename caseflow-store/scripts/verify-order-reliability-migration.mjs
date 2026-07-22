import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const MIGRATION_PATH = path.join(
  ROOT,
  "supabase/migrations/0011_atomic_idempotent_book_orders.sql",
);
const artifactId =
  process.env.ORDER_RELIABILITY_ARTIFACT_ID ?? "order-reliability-t02";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "migration-contract-check.json");

const migration = await fs.readFile(MIGRATION_PATH, "utf8");

const checks = {
  additiveAttemptColumn:
    /add column if not exists checkout_attempt_id uuid/i.test(migration),
  atomicVoucherUpdate:
    /update public\.customer_promotion_vouchers[\s\S]*used_order_id = new_order\.id/i.test(
      migration,
    ),
  beginCommit: /^begin;[\s\S]*commit;\s*$/im.test(migration),
  idempotentConflict:
    /on conflict \(customer_id, checkout_attempt_id\)[\s\S]*do nothing/i.test(
      migration,
    ),
  orderVoucherHistoryRestricted:
    /customer_promotion_vouchers_used_order_id_fkey[\s\S]*on delete restrict/i.test(
      migration,
    ),
  positiveServerSubtotal:
    /calculated_subtotal_vnd <= 0/i.test(migration),
  releasedRpcRetained:
    !/drop function[^;]*create_book_order_with_items\s*\(/i.test(migration),
  serviceRoleOnly:
    /revoke all on function public\.create_book_order_with_items_v2[\s\S]*from public, anon, authenticated;[\s\S]*grant execute on function public\.create_book_order_with_items_v2[\s\S]*to service_role;/i.test(
      migration,
    ),
  uniqueCustomerAttempt:
    /create unique index if not exists orders_customer_checkout_attempt_unique_idx[\s\S]*\(customer_id, checkout_attempt_id\)/i.test(
      migration,
    ),
  versionedRpc:
    /create or replace function public\.create_book_order_with_items_v2\(/i.test(
      migration,
    ),
  voucherEligibilityEnforced:
    /Signup voucher is invalid, expired, reserved, or used/i.test(migration),
};

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  checkedAt: new Date().toISOString(),
  checks,
  failures,
  migration: path.relative(ROOT, MIGRATION_PATH),
  ok: failures.length === 0,
};

await fs.mkdir(artifactDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  throw new Error(`Order reliability migration failed: ${failures.join(", ")}`);
}

console.log(JSON.stringify(report, null, 2));
