import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import { dispatchNotificationBatch, getNotificationRetryAt } from "../src/lib/notifications/dispatcher";
import type { NotificationRuntimeConfig } from "../src/lib/notifications/config";
import { createNotificationProvider } from "../src/lib/notifications/providers";
import type { NotificationOutboxRepository } from "../src/lib/notifications/repository";
import { renderNotificationContent } from "../src/lib/notifications/templates";
import type {
  NotificationChannel,
  NotificationOutboxRecord,
  NotificationProvider,
} from "../src/types/notifications";

async function main() {
const ROOT = process.cwd();
const artifactId = process.env.NOTIFICATION_ARTIFACT_ID ?? "notify-t04";
const artifactDirectory = path.join(ROOT, ".agent/artifacts", artifactId);
const reportPath = path.join(artifactDirectory, "notification-runtime-check.json");
const checks: Record<string, boolean> = {};

let networkCalls = 0;
const forbiddenNetwork: typeof fetch = async () => {
  networkCalls += 1;
  throw new Error("Sandbox provider attempted a network call");
};
const sandboxConfig = createConfig("sandbox");
const sandboxProvider = createNotificationProvider({
  channel: "email",
  config: sandboxConfig,
  fetcher: forbiddenNetwork,
});
const sandboxResult = await sandboxProvider.send(createRequest("email"));
checks.sandboxNeverCallsNetwork = networkCalls === 0;
checks.sandboxIsHonestPreview =
  sandboxResult.status === "blocked" &&
  sandboxResult.code === "SANDBOX_PREVIEW" &&
  sandboxResult.preview?.channel === "email";

const disabledProvider = createNotificationProvider({
  channel: "sms",
  config: createConfig("disabled"),
  fetcher: forbiddenNetwork,
});
const disabledResult = await disabledProvider.send(createRequest("sms"));
checks.disabledFailsClosed =
  disabledResult.status === "blocked" &&
  disabledResult.code === "EXTERNAL_DELIVERY_DISABLED" &&
  networkCalls === 0;

const resendCalls: Array<{ init?: RequestInit; url: string }> = [];
const resendFetcher = (async (input: URL | RequestInfo, init?: RequestInit) => {
  resendCalls.push({ init, url: input.toString() });
  return new Response(JSON.stringify({ id: "email_test_1" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}) as typeof fetch;
const resendProvider = createNotificationProvider({
  channel: "email",
  config: createConfig("live"),
  fetcher: resendFetcher,
});
const resendResult = await resendProvider.send(createRequest("email"));
checks.resendUsesServerAdapter =
  resendResult.status === "sent" &&
  resendResult.providerMessageId === "email_test_1" &&
  resendCalls.length === 1 &&
  resendCalls[0].url === "https://api.resend.com/emails" &&
  String(new Headers(resendCalls[0].init?.headers).get("Idempotency-Key")).includes(
    "order:",
  );

const twilioCalls: Array<{ init?: RequestInit; url: string }> = [];
const twilioFetcher = (async (input: URL | RequestInfo, init?: RequestInit) => {
  twilioCalls.push({ init, url: input.toString() });
  return new Response(JSON.stringify({ sid: "SM_TEST_1" }), {
    headers: { "Content-Type": "application/json" },
    status: 201,
  });
}) as typeof fetch;
const twilioProvider = createNotificationProvider({
  channel: "sms",
  config: createConfig("live"),
  fetcher: twilioFetcher,
});
const twilioResult = await twilioProvider.send(createRequest("sms"));
checks.twilioUsesServerAdapter =
  twilioResult.status === "sent" &&
  twilioResult.providerMessageId === "SM_TEST_1" &&
  twilioCalls.length === 1 &&
  new Headers(twilioCalls[0].init?.headers).get("Authorization")?.startsWith("Basic ") ===
    true;

const rendered = renderNotificationContent({
  eventType: "payment.awaiting-transfer",
  metadata: { orderCode: "CF-TEST-001" },
});
checks.templateIsSpecificAndLocalized =
  rendered.body.includes("CF-TEST-001") &&
  rendered.body.includes("chuyển khoản") &&
  rendered.locale === "vi";

const now = new Date("2026-07-22T12:00:00.000Z");
checks.exponentialRetryIsDeterministic =
  getNotificationRetryAt(1, now) === "2026-07-22T12:00:30.000Z" &&
  getNotificationRetryAt(5, now) === "2026-07-22T12:08:00.000Z";

const sandboxRepository = createMemoryRepository([createOutboxRecord(1)]);
const sandboxSummary = await dispatchNotificationBatch({
  limit: 25,
  now,
  repository: sandboxRepository,
  resolveProvider: () => sandboxProvider,
});
checks.dispatcherStoresSandboxAsBlocked =
  sandboxSummary.blocked === 1 &&
  sandboxRepository.events.some((event) => event.startsWith("blocked:SANDBOX_PREVIEW"));

const retryRepository = createMemoryRepository([createOutboxRecord(1)]);
const retryProvider: NotificationProvider = {
  channel: "email",
  async send() {
    return { code: "RESEND_HTTP_503", retryable: true, status: "failed" };
  },
};
const retrySummary = await dispatchNotificationBatch({
  limit: 25,
  now,
  repository: retryRepository,
  resolveProvider: () => retryProvider,
});
checks.retryableFailureReturnsToQueue =
  retrySummary.retried === 1 &&
  retryRepository.events.includes("retry:RESEND_HTTP_503:2026-07-22T12:00:30.000Z");

const terminalRepository = createMemoryRepository([createOutboxRecord(5)]);
const terminalSummary = await dispatchNotificationBatch({
  limit: 25,
  now,
  repository: terminalRepository,
  resolveProvider: () => retryProvider,
});
checks.maxAttemptsBecomeTerminal =
  terminalSummary.failed === 1 &&
  terminalRepository.events.includes("failed:RESEND_HTTP_503");

const failures = Object.entries(checks)
  .filter(([, passed]) => !passed)
  .map(([name]) => name);
const report = {
  checkedAt: new Date().toISOString(),
  checks,
  failures,
  networkCalls,
  ok: failures.length === 0,
};

await fs.mkdir(artifactDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
assert.deepEqual(failures, []);
console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function createConfig(mode: NotificationRuntimeConfig["mode"]): NotificationRuntimeConfig {
  return {
    dispatchSecret: mode === "live" ? "dispatch-test-secret" : null,
    email: {
      apiKey: mode === "live" ? "resend-test-key" : null,
      from: mode === "live" ? "CaseFlow Books <orders@example.test>" : null,
      provider: mode === "live" ? "resend" : mode === "sandbox" ? "sandbox" : "disabled",
      replyTo: null,
    },
    issues: [],
    mode,
    otpHashSecret: mode === "live" ? "otp-test-secret" : null,
    sms: {
      accountSid: mode === "live" ? "AC_TEST" : null,
      authToken: mode === "live" ? "twilio-test-token" : null,
      from: null,
      messagingServiceSid: mode === "live" ? "MG_TEST" : null,
      provider: mode === "live" ? "twilio" : mode === "sandbox" ? "sandbox" : "disabled",
    },
  };
}

function createRequest(channel: NotificationChannel) {
  return {
    channel,
    content: {
      body: "Đơn CF-TEST-001 đã được tiếp nhận.",
      locale: "vi" as const,
      subject: "Đơn hàng đã được tiếp nhận",
      title: "Đơn hàng đã được tiếp nhận",
    },
    eventKey: `order:test:created:${channel}`,
    eventType: "order.created" as const,
    metadata: { orderCode: "CF-TEST-001" },
    outboxId: "00000000-0000-4000-8000-000000000001",
    recipient: {
      customerId: "00000000-0000-4000-8000-000000000002",
      email: "customer@example.test",
      phone: "+84900000000",
    },
    templateKey: "order-created" as const,
  };
}

function createOutboxRecord(attempts: number): NotificationOutboxRecord {
  return {
    attempts,
    channel: "email",
    createdAt: "2026-07-22T11:00:00.000Z",
    customerId: "00000000-0000-4000-8000-000000000002",
    eventKey: "order:test:created",
    eventType: "order.created",
    id: "00000000-0000-4000-8000-000000000001",
    lastErrorCode: null,
    metadata: { orderCode: "CF-TEST-001" },
    nextAttemptAt: "2026-07-22T11:00:00.000Z",
    orderId: "00000000-0000-4000-8000-000000000003",
    providerMessageId: null,
    renderedPreview: null,
    sentAt: null,
    status: "processing",
    templateKey: "order-created",
    updatedAt: "2026-07-22T11:00:00.000Z",
  };
}

function createMemoryRepository(initial: NotificationOutboxRecord[]) {
  let claimed = false;
  const events: string[] = [];
  const repository: NotificationOutboxRepository & { events: string[] } = {
    events,
    async claimBatch() {
      if (claimed) return [];
      claimed = true;
      return initial;
    },
    async getRecipient(customerId) {
      return {
        customerId,
        email: "customer@example.test",
        phone: "+84900000000",
      };
    },
    async markBlocked(input) {
      events.push(`blocked:${input.code}`);
    },
    async markFailed(input) {
      events.push(`failed:${input.code}`);
    },
    async markSent(input) {
      events.push(`sent:${input.providerMessageId}`);
    },
    async releaseForRetry(input) {
      events.push(`retry:${input.code}:${input.nextAttemptAt}`);
    },
  };
  return repository;
}
