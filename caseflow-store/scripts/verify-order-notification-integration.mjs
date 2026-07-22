import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const artifactId = process.env.NOTIFICATION_ARTIFACT_ID ?? "notify-t06";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "order-notification-integration-check.json");

const paths = {
  adminRoute: "src/app/api/admin/orders/[id]/route.ts",
  cancelRoute: "src/app/api/customer/orders/[orderCode]/route.ts",
  createUseCase: "src/lib/use-cases/orders/create-book-order.ts",
  customerCancelUseCase: "src/lib/use-cases/orders/cancel-customer-order.ts",
  decisionRoute: "src/app/api/admin/orders/[id]/transfer-decision/route.ts",
  decisionUseCase: "src/lib/use-cases/orders/decide-simulated-transfer.ts",
  migration: "supabase/migrations/0012_transactional_notifications.sql",
  orderRepository: "src/lib/repositories/supabase-orders.ts",
  orderUi: "src/features/admin/admin-orders-page.tsx",
  updateUseCase: "src/lib/use-cases/orders/update-order-operations.ts",
};
const entries = await Promise.all(
  Object.entries(paths).map(async ([key, file]) => [
    key,
    await fs.readFile(path.join(ROOT, file), "utf8"),
  ]),
);
const source = Object.fromEntries(entries);

const checks = {
  adminControllerDelegatesToUseCase:
    /updateOrderOperationsUseCase/.test(source.adminRoute) &&
    !/supabase-orders/.test(source.adminRoute),
  bestEffortAfterAllMutations:
    /dispatchCommerceNotificationsBestEffort/.test(source.createUseCase) &&
    /dispatchCommerceNotificationsBestEffort/.test(source.customerCancelUseCase) &&
    /dispatchCommerceNotificationsBestEffort/.test(source.updateUseCase),
  customerCancellationDelegatesToUseCase:
    /cancelCustomerOrderUseCase/.test(source.cancelRoute) &&
    !/cancelSupabaseOrderForCustomer/.test(source.cancelRoute),
  customerCannotSelfConfirm:
    !/paymentStatus.*confirmed|payment_status.*confirmed/.test(source.cancelRoute),
  eventCoverage:
    [
      "order.created",
      "order.confirmed",
      "order.cancelled",
      "payment.awaiting-transfer",
      "payment.confirmed",
      "payment.rejected",
      "shipping.shipped",
      "order.completed",
    ].every((event) => source.migration.includes(`'${event}'`)),
  paidCancellationBlocked:
    /Paid orders require a refund workflow before cancellation/.test(
      source.orderRepository,
    ),
  shippedCancellationBlocked:
    /Dispatched orders require the return workflow instead of cancellation/.test(
      source.orderRepository,
    ),
  transferDecisionIsProtected:
    /requireAdminPermission\("orders:update-status"\)/.test(source.decisionUseCase),
  transferDecisionIsMethodScoped:
    /paymentMethod !== "bank-transfer"/.test(source.decisionUseCase) &&
    /paymentStatus !== "awaiting-transfer"/.test(source.decisionUseCase),
  transferDecisionUiIsExplicit:
    /data-admin-transfer-confirm-prepare/.test(source.orderUi) &&
    /data-admin-transfer-reject-prepare/.test(source.orderUi),
  transferRejectNeedsReason:
    /input\.action === "reject"/.test(
      await fs.readFile(path.join(ROOT, "src/lib/validation/orders.ts"), "utf8"),
    ),
  triggerIsIdempotent:
    /on conflict \(event_key, channel\) do nothing/.test(source.migration),
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
  throw new Error(`Order notification integration failed: ${failures.join(", ")}`);
}

console.log(JSON.stringify(report, null, 2));
