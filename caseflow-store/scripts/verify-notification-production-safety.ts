import fs from "node:fs";
import path from "node:path";

const ARTIFACT_ID =
  process.env.NOTIFICATION_SAFETY_ARTIFACT_ID ?? "notify-production-safety";
const ARTIFACT_DIR = path.join(".agent", "artifacts", ARTIFACT_ID);
const BASE_URL = parseBaseURL(
  process.env.NOTIFICATION_SAFETY_BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://127.0.0.1:3000",
);
const EXAMPLE_ID = "00000000-0000-4000-8000-000000000001";

const checks = [
  { label: "customer inbox", method: "GET", path: "/api/customer/notifications" },
  {
    body: { phone: "+84900000000" },
    label: "phone verification request",
    method: "POST",
    path: "/api/customer/phone-verification/request",
  },
  {
    body: { challengeId: EXAMPLE_ID, code: "000000" },
    label: "phone verification completion",
    method: "POST",
    path: "/api/customer/phone-verification/verify",
  },
  { label: "admin notification list", method: "GET", path: "/api/admin/notifications" },
  {
    label: "admin notification config",
    method: "GET",
    path: "/api/admin/notifications/config",
  },
  {
    label: "notification retry",
    method: "POST",
    path: `/api/admin/notifications/${EXAMPLE_ID}/retry`,
  },
  {
    body: { action: "confirm", reason: "Anonymous boundary check" },
    label: "simulated transfer decision",
    method: "POST",
    path: `/api/admin/orders/${EXAMPLE_ID}/transfer-decision`,
  },
  {
    body: {},
    label: "internal dispatcher",
    method: "POST",
    path: "/api/internal/notifications/dispatch",
  },
] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const results = [];

  for (const check of checks) {
    const response = await fetch(new URL(check.path, BASE_URL), {
      body: "body" in check ? JSON.stringify(check.body) : undefined,
      headers: {
        accept: "application/json",
        ...(check.method === "POST" ? { "content-type": "application/json" } : {}),
      },
      method: check.method,
      redirect: "manual",
    });
    const payload = (await response.json()) as {
      error?: { code?: string } | null;
    };
    const code = payload.error?.code ?? null;

    results.push({
      code,
      label: check.label,
      ok: response.status === 401 && code === "UNAUTHORIZED",
      path: check.path,
      status: response.status,
    });
  }

  const report = {
    baseURL: BASE_URL,
    generatedAt: new Date().toISOString(),
    ok: results.every((result) => result.ok),
    results,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "notification-production-safety-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) process.exitCode = 1;
}

function parseBaseURL(raw: string) {
  const value = new URL(raw);

  if (!new Set(["http:", "https:"]).has(value.protocol)) {
    throw new Error("Notification safety base URL must use HTTP or HTTPS");
  }

  return value.toString();
}

void main();
