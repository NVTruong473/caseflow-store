import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d40-t01");

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const cleanup = await inspectReleaseCleanup();
  const ok = cleanup.totalMatches === 0;
  const report = {
    cleanup,
    generatedAt: new Date().toISOString(),
    ok,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "release-cleanup-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

async function inspectReleaseCleanup() {
  const [
    authUsers,
    e2eOrders,
    e2eProfiles,
    operationOrdersByCode,
    operationOrdersByEmail,
    operationProfiles,
    qaAuthors,
    qaEditions,
    qaInventoryAdjustments,
    qaPromotions,
    staticLegacyOrders,
  ] = await Promise.all([
    countAuthUsersByEmailPatterns([
      /^caseflow\.customer\..+@example\.com$/i,
      /^caseflow-d\d+-.+@example\.com$/i,
    ]),
    countOrdersByCustomerEmail("caseflow.customer.%@example.com"),
    countProfilesByEmail("caseflow.customer.%@example.com"),
    sumCounts([
      countOrdersByCode("CF-D36%"),
      countOrdersByCode("CF-D37%"),
      countOrdersByCode("CF-D38%"),
      countOrdersByCode("CF-D39%"),
      countOrdersByCode("CF-D40%"),
    ]),
    sumCounts([
      countOrdersByCustomerEmail("caseflow-d35-%"),
      countOrdersByCustomerEmail("caseflow-d36-%"),
      countOrdersByCustomerEmail("caseflow-d37-%"),
      countOrdersByCustomerEmail("caseflow-d38-%"),
      countOrdersByCustomerEmail("caseflow-d39-%"),
      countOrdersByCustomerEmail("caseflow-d40-%"),
    ]),
    sumCounts([
      countProfilesByEmail("caseflow-d35-%"),
      countProfilesByEmail("caseflow-d36-%"),
      countProfilesByEmail("caseflow-d37-%"),
      countProfilesByEmail("caseflow-d38-%"),
      countProfilesByEmail("caseflow-d39-%"),
      countProfilesByEmail("caseflow-d40-%"),
    ]),
    sumCounts([
      countBookAuthorsBySlug("d38-dashboard-qa-%"),
      countBookAuthorsBySlug("qa-%"),
    ]),
    sumCounts([
      countBookEditionsBySlug("qa-d36-%"),
      countBookEditionsBySlug("d38-dashboard-qa-%"),
      countBookEditionsBySlug("qa-%"),
    ]),
    countInventoryAdjustmentsByReason("QA%"),
    sumCounts([
      countBookPromotionsByCode("D37%"),
      countBookPromotionsByCode("D38%"),
      countBookPromotionsByCode("QA%"),
    ]),
    sumCounts([
      countOrdersByCustomerEmail("d15-access-admin@example.com"),
      countOrdersByCustomerEmail("d17.admin-workflow@example.com"),
      countOrdersByCustomerEmail("d17.storefront-flow@example.com"),
      countOrdersByCustomerEmail("keyboard-focus@example.com"),
      countOrdersByCustomerEmail("state-audit@example.com"),
      countOrdersByCustomerEmail("van@example.com"),
    ]),
  ]);
  const totalMatches =
    authUsers +
    e2eOrders +
    e2eProfiles +
    operationOrdersByCode +
    operationOrdersByEmail +
    operationProfiles +
    qaAuthors +
    qaEditions +
    qaInventoryAdjustments +
    qaPromotions +
    staticLegacyOrders;

  return {
    authUsers,
    e2eOrders,
    e2eProfiles,
    operationOrdersByCode,
    operationOrdersByEmail,
    operationProfiles,
    qaAuthors,
    qaEditions,
    qaInventoryAdjustments,
    qaPromotions,
    staticLegacyOrders,
    totalMatches,
  };
}

async function countAuthUsersByEmailPatterns(patterns: RegExp[]) {
  const admin = createSupabaseAdminClient();
  let page = 1;
  let total = 0;
  const perPage = 1_000;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    total += data.users.filter((user) =>
      patterns.some((pattern) => pattern.test(user.email ?? "")),
    ).length;

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return total;
}

async function countOrdersByCode(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .ilike("order_code", pattern);

  if (error) {
    throw new Error(`Could not count orders by code: ${error.message}`);
  }

  return count ?? 0;
}

async function countOrdersByCustomerEmail(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .ilike("customer_email", pattern);

  if (error) {
    throw new Error(`Could not count orders by email: ${error.message}`);
  }

  return count ?? 0;
}

async function countProfilesByEmail(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .ilike("email", pattern);

  if (error) {
    throw new Error(`Could not count profiles: ${error.message}`);
  }

  return count ?? 0;
}

async function countBookEditionsBySlug(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_editions")
    .select("id", { count: "exact", head: true })
    .ilike("slug", pattern);

  if (error) {
    throw new Error(`Could not count QA book editions: ${error.message}`);
  }

  return count ?? 0;
}

async function countBookAuthorsBySlug(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_authors")
    .select("id", { count: "exact", head: true })
    .ilike("slug", pattern);

  if (error) {
    throw new Error(`Could not count QA book authors: ${error.message}`);
  }

  return count ?? 0;
}

async function countBookPromotionsByCode(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_promotions")
    .select("id", { count: "exact", head: true })
    .ilike("code", pattern);

  if (error) {
    throw new Error(`Could not count QA promotions: ${error.message}`);
  }

  return count ?? 0;
}

async function countInventoryAdjustmentsByReason(pattern: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("book_inventory_adjustments")
    .select("id", { count: "exact", head: true })
    .ilike("reason", pattern);

  if (error) {
    throw new Error(`Could not count QA inventory adjustments: ${error.message}`);
  }

  return count ?? 0;
}

async function sumCounts(promises: Array<Promise<number>>) {
  const counts = await Promise.all(promises);

  return counts.reduce((sum, count) => sum + count, 0);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
