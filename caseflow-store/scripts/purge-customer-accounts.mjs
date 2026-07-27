import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const { Client } = pg;
const ROOT = process.cwd();
const executeRequested = process.argv.includes("--execute");
const expectedCustomerCount = readIntegerArgument("--expected-customers");
const expectedProtectedCount = readIntegerArgument("--expected-protected");
const connectionString = process.env.SUPABASE_DB_URL;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const artifactDirectory = path.join(
  ROOT,
  ".agent/artifacts/customer-reset-t01",
);
const reportPath = path.join(
  artifactDirectory,
  "customer-account-purge-check.json",
);

if (!connectionString || !supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_DB_URL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required",
  );
}

if (executeRequested && expectedCustomerCount === null) {
  throw new Error("--expected-customers is required with --execute");
}

if (executeRequested && expectedProtectedCount === null) {
  throw new Error("--expected-protected is required with --execute");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { client, connectionMode } = await connectDatabase({
  connectionString,
  projectRef,
});

let report;

try {
  const before = await inspectAccounts(client, supabase);

  assertExpectedCounts(before);

  if (before.orphanAuthUserCount > 0) {
    throw new Error(
      "Unclassified Auth users exist; refusing to infer customer roles",
    );
  }

  if (before.customerCreatedInventoryAdjustmentCount > 0) {
    throw new Error(
      "Customer-owned inventory adjustments exist; refusing destructive cleanup",
    );
  }

  let deletedBusinessRows = null;
  const authDeletionFailures = [];

  if (executeRequested) {
    deletedBusinessRows = await deleteCustomerBusinessData(
      client,
      before.customerIds,
    );

    // Chỉ xoá Auth user sau khi transaction dữ liệu nghiệp vụ đã commit.
    // Danh sách ID được lấy từ profiles.role='customer'; admin/staff không thể
    // lọt vào tập đích nếu kiểm tra role phía trên không vượt qua.
    for (const customerId of before.customerIds) {
      const { error } = await supabase.auth.admin.deleteUser(customerId);

      if (error) {
        authDeletionFailures.push({
          idDigest: digestValue(customerId),
          message: error.message,
        });
      }
    }
  }

  const after = await inspectAccounts(client, supabase);
  const checks = {
    allTargetAuthUsersDeleted:
      !executeRequested ||
      (after.customerAuthUserCount === 0 &&
        authDeletionFailures.length === 0),
    allTargetProfilesDeleted:
      !executeRequested || after.customerProfileCount === 0,
    noOrphanAuthUsers: after.orphanAuthUserCount === 0,
    protectedAuthUsersPreserved:
      after.protectedAuthUserCount === before.protectedAuthUserCount,
    protectedProfilesPreserved:
      after.protectedProfileCount === before.protectedProfileCount,
    protectedRoleCountsPreserved:
      after.adminProfileCount === before.adminProfileCount &&
      after.staffProfileCount === before.staffProfileCount,
  };
  const ok = Object.values(checks).every(Boolean);

  report = {
    after: summarizeInspection(after),
    authDeletionFailures,
    before: summarizeInspection(before),
    checkedAt: new Date().toISOString(),
    checks,
    connectionMode,
    deletedBusinessRows,
    executeRequested,
    ok,
    targetSetDigest: digestValue(before.customerIds.slice().sort().join(",")),
  };

  if (!ok) {
    process.exitCode = 1;
  }
} finally {
  await client.end();
}

await fs.mkdir(artifactDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

async function inspectAccounts(client, supabase) {
  const profilesResult = await client.query(`
    select id, role
    from public.profiles
    order by id
  `);
  const profiles = profilesResult.rows;
  const customerIds = profiles
    .filter((profile) => profile.role === "customer")
    .map((profile) => profile.id);
  const protectedIds = profiles
    .filter(
      (profile) => profile.role === "admin" || profile.role === "staff",
    )
    .map((profile) => profile.id);
  const overlap = customerIds.filter((id) => protectedIds.includes(id));

  if (overlap.length > 0) {
    throw new Error("Customer and protected role sets overlap");
  }

  const authUsers = await listAllAuthUsers(supabase);
  const profileIds = new Set(profiles.map((profile) => profile.id));
  const authUserIds = new Set(authUsers.map((user) => user.id));
  const customerOrderResult =
    customerIds.length > 0
      ? await client.query(
          `
            select id
            from public.orders
            where customer_id = any($1::uuid[])
          `,
          [customerIds],
        )
      : { rows: [] };
  const orderIds = customerOrderResult.rows.map((row) => row.id);
  const dependentCountsResult = await client.query(
    `
      select
        (
          select count(*)::integer
          from public.order_items
          where order_id = any($2::uuid[])
        ) as order_item_count,
        (
          select count(*)::integer
          from public.payments
          where order_id = any($2::uuid[])
        ) as payment_count,
        (
          select count(*)::integer
          from public.customer_promotion_vouchers
          where customer_id = any($1::uuid[])
        ) as voucher_count,
        (
          select count(*)::integer
          from public.notification_outbox
          where customer_id = any($1::uuid[])
        ) as notification_outbox_count,
        (
          select count(*)::integer
          from public.customer_notifications
          where customer_id = any($1::uuid[])
        ) as customer_notification_count,
        (
          select count(*)::integer
          from public.phone_verification_challenges
          where customer_id = any($1::uuid[])
        ) as phone_challenge_count,
        (
          select count(*)::integer
          from public.customer_addresses
          where user_id = any($1::uuid[])
        ) as address_count,
        (
          select count(*)::integer
          from public.book_inventory_adjustments
          where created_by_user_id = any($1::uuid[])
        ) as customer_inventory_adjustment_count
    `,
    [customerIds, orderIds],
  );
  const counts = dependentCountsResult.rows[0];

  return {
    addressCount: counts.address_count,
    adminProfileCount: profiles.filter((profile) => profile.role === "admin")
      .length,
    authUserCount: authUsers.length,
    customerAuthUserCount: customerIds.filter((id) => authUserIds.has(id))
      .length,
    customerCreatedInventoryAdjustmentCount:
      counts.customer_inventory_adjustment_count,
    customerIds,
    customerNotificationCount: counts.customer_notification_count,
    customerProfileCount: customerIds.length,
    notificationOutboxCount: counts.notification_outbox_count,
    orderCount: orderIds.length,
    orderItemCount: counts.order_item_count,
    orphanAuthUserCount: authUsers.filter((user) => !profileIds.has(user.id))
      .length,
    paymentCount: counts.payment_count,
    phoneChallengeCount: counts.phone_challenge_count,
    protectedAuthUserCount: protectedIds.filter((id) => authUserIds.has(id))
      .length,
    protectedProfileCount: protectedIds.length,
    staffProfileCount: profiles.filter((profile) => profile.role === "staff")
      .length,
    voucherCount: counts.voucher_count,
  };
}

async function deleteCustomerBusinessData(client, customerIds) {
  await client.query("begin");

  try {
    const lockedProfiles = await client.query(
      `
        select id, role
        from public.profiles
        where id = any($1::uuid[])
        for update
      `,
      [customerIds],
    );

    if (
      lockedProfiles.rows.length !== customerIds.length ||
      lockedProfiles.rows.some((profile) => profile.role !== "customer")
    ) {
      throw new Error("Customer role set changed after preflight");
    }

    const inventoryAdjustmentCheck = await client.query(
      `
        select count(*)::integer as count
        from public.book_inventory_adjustments
        where created_by_user_id = any($1::uuid[])
      `,
      [customerIds],
    );

    if (inventoryAdjustmentCheck.rows[0].count > 0) {
      throw new Error(
        "Customer-owned inventory adjustments appeared after preflight",
      );
    }

    const orderResult = await client.query(
      `
        select id
        from public.orders
        where customer_id = any($1::uuid[])
        for update
      `,
      [customerIds],
    );
    const orderIds = orderResult.rows.map((row) => row.id);
    const deleted = {};

    deleted.customerNotifications = (
      await client.query(
        `
          delete from public.customer_notifications
          where customer_id = any($1::uuid[])
        `,
        [customerIds],
      )
    ).rowCount;
    deleted.notificationOutbox = (
      await client.query(
        `
          delete from public.notification_outbox
          where customer_id = any($1::uuid[])
        `,
        [customerIds],
      )
    ).rowCount;
    deleted.phoneChallenges = (
      await client.query(
        `
          delete from public.phone_verification_challenges
          where customer_id = any($1::uuid[])
        `,
        [customerIds],
      )
    ).rowCount;
    deleted.vouchers = (
      await client.query(
        `
          delete from public.customer_promotion_vouchers
          where customer_id = any($1::uuid[])
        `,
        [customerIds],
      )
    ).rowCount;
    deleted.payments =
      orderIds.length === 0
        ? 0
        : (
            await client.query(
              `
                delete from public.payments
                where order_id = any($1::uuid[])
              `,
              [orderIds],
            )
          ).rowCount;
    deleted.orders = (
      await client.query(
        `
          delete from public.orders
          where customer_id = any($1::uuid[])
        `,
        [customerIds],
      )
    ).rowCount;
    deleted.addresses = (
      await client.query(
        `
          delete from public.customer_addresses
          where user_id = any($1::uuid[])
        `,
        [customerIds],
      )
    ).rowCount;

    await client.query("commit");
    return deleted;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function listAllAuthUsers(supabase) {
  const users = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    users.push(...data.users);

    if (data.users.length < 1000) {
      return users;
    }
  }
}

function assertExpectedCounts(inspection) {
  if (
    expectedCustomerCount !== null &&
    inspection.customerProfileCount !== expectedCustomerCount
  ) {
    throw new Error(
      `Expected ${expectedCustomerCount} customers, found ${inspection.customerProfileCount}`,
    );
  }

  if (
    expectedProtectedCount !== null &&
    inspection.protectedProfileCount !== expectedProtectedCount
  ) {
    throw new Error(
      `Expected ${expectedProtectedCount} protected profiles, found ${inspection.protectedProfileCount}`,
    );
  }

  if (
    inspection.protectedAuthUserCount !== inspection.protectedProfileCount
  ) {
    throw new Error("A protected profile is missing its Auth user");
  }
}

function summarizeInspection(inspection) {
  const summary = { ...inspection };
  delete summary.customerIds;

  return summary;
}

function readIntegerArgument(name) {
  const prefix = `${name}=`;
  const rawValue = process.argv.find((argument) => argument.startsWith(prefix));

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue.slice(prefix.length));

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }

  return value;
}

function digestValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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
