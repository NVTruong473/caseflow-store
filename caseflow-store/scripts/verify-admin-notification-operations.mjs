import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const artifactId = process.env.NOTIFICATION_ARTIFACT_ID ?? "notify-t07";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(
  artifactDirectory,
  "admin-notification-operations-check.json",
);
const paths = {
  auth: "src/lib/auth/admin.ts",
  config: "src/lib/notifications/config.ts",
  configRoute: "src/app/api/admin/notifications/config/route.ts",
  feature: "src/features/admin/admin-notifications-page.tsx",
  listRoute: "src/app/api/admin/notifications/route.ts",
  navigation: "src/features/admin/admin-navigation.tsx",
  repository: "src/lib/notifications/repository.ts",
  retryRoute: "src/app/api/admin/notifications/[id]/retry/route.ts",
  retryUseCase:
    "src/lib/use-cases/notifications/retry-notification-delivery.ts",
  types: "src/types/notifications.ts",
};
const entries = await Promise.all(
  Object.entries(paths).map(async ([key, file]) => [
    key,
    await fs.readFile(path.join(ROOT, file), "utf8"),
  ]),
);
const source = Object.fromEntries(entries);

const adminBlock = source.auth.match(
  /admin:\s*\[([\s\S]*?)\],\s*staff:/,
)?.[1];
const staffBlock = source.auth.match(/staff:\s*\[([\s\S]*?)\],\s*};/)?.[1];
const publicItemBlock = source.types.match(
  /export type AdminNotificationOperationsItem = \{([\s\S]*?)\n};/,
)?.[1];
const retryResultBlock = source.retryUseCase.match(
  /type RetryNotificationDeliveryResult = \{([\s\S]*?)\n};/,
)?.[1];

const checks = {
  adminConfigIsAdminOnly:
    /requireAdminPermission\("notifications:manage-config"\)/.test(
      source.configRoute,
    ) && adminBlock?.includes('"notifications:manage-config"'),
  listRequiresNotificationRead:
    /requireAdminPermission\("notifications:read"\)/.test(source.listRoute),
  noSensitiveRecipientData:
    Boolean(publicItemBlock) &&
    !/(email|phone|metadata|renderedPreview|providerMessageId)/.test(
      publicItemBlock ?? "",
    ) &&
    /Customer \$\{row\.customer_id\.slice\(0, 8\)\}/.test(source.repository),
  responsiveOperationsView:
    /hidden overflow-x-auto lg:block/.test(source.feature) &&
    /lg:hidden/.test(source.feature),
  retryDelegatesToUseCase:
    /retryNotificationDeliveryUseCase/.test(source.retryRoute) &&
    !/notifications\/repository/.test(source.retryRoute),
  retryIsPermissionScoped:
    /requireAdminPermission\("notifications:retry"\)/.test(source.retryUseCase),
  retryIsStateAndProviderGuarded:
    /record\.status === "blocked" \|\| record\.status === "failed"/.test(
      source.retryUseCase,
    ) &&
    /record\.channel !== "in-app"/.test(source.retryUseCase) &&
    /record\.lastErrorCode === "SANDBOX_PREVIEW"/.test(source.retryUseCase) &&
    /isExternalNotificationChannelReady/.test(source.retryUseCase),
  retryResponseIsMinimized:
    Boolean(retryResultBlock) &&
    !/(customer|metadata|preview|provider|recipient|email|phone)/i.test(
      retryResultBlock ?? "",
    ),
  sanitizedConfigSummary:
    /NotificationConfigurationSummary/.test(source.config) &&
    !/apiKey:|authToken:|otpHashSecret:|dispatchSecret:/.test(
      source.config.match(
        /export function getNotificationConfigurationSummary[\s\S]*?\n}/,
      )?.[0] ?? "",
    ),
  staffCanInspectAndRetry:
    staffBlock?.includes('"notifications:read"') &&
    staffBlock?.includes('"notifications:retry"') &&
    !staffBlock?.includes('"notifications:manage-config"'),
  navigationIncludesOperationsSurface:
    /key: "notifications"/.test(source.navigation) &&
    /requiredPermission: "notifications:read"/.test(source.navigation),
  uiDoesNotRenderSensitiveFields:
    !/(renderedPreview|providerMessageId|recipient\.email|recipient\.phone)/.test(
      source.feature,
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
  throw new Error(
    `Admin notification operations verification failed: ${failures.join(", ")}`,
  );
}

console.log(JSON.stringify(report, null, 2));
