import fs from "node:fs";
import path from "node:path";

const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.PAYQR_ARTIFACT_ID ?? "payqr-t01",
);

type Finding = {
  check: string;
  message: string;
};

const sourceChecks: Array<{
  check: string;
  file: string;
  required: string[];
}> = [
  {
    check: "simulate-endpoint-server-lock",
    file: "src/lib/payments/config.ts",
    required: [
      'process.env.NODE_ENV !== "production"',
      '"ENABLE_MOCK_PAYMENT"',
      "allowSimulation",
    ],
  },
  {
    check: "webhook-hmac-signature",
    file: "src/lib/payments/service.ts",
    required: [
      "createHmac",
      "timingSafeEqual",
      "getMockPaymentWebhookSecret",
      "verifyMockWebhookSignature",
    ],
  },
  {
    check: "server-owned-payment-amount",
    file: "src/lib/payments/service.ts",
    required: [
      "orders.total_vnd",
      "order.total_vnd",
      "khong",
    ],
  },
  {
    check: "demo-account-default",
    file: "src/lib/payments/config.ts",
    required: ["0000000000", "DEMO"],
  },
  {
    check: "qr-demo-visible-labels",
    file: "src/features/checkout/qr-payment-page.tsx",
    required: [
      "THANH TOÁN DEMO - KHÔNG CHUYỂN TIỀN THẬT",
      "QR DEMO - KHÔNG CÓ GIÁ TRỊ THANH TOÁN THẬT",
    ],
  },
];

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const findings: Finding[] = [];

  for (const sourceCheck of sourceChecks) {
    const content = fs.readFileSync(
      path.join(process.cwd(), sourceCheck.file),
      "utf8",
    );

    for (const token of sourceCheck.required) {
      if (!content.includes(token)) {
        findings.push({
          check: sourceCheck.check,
          message: `${sourceCheck.file} is missing ${token}`,
        });
      }
    }
  }

  findings.push(...scanForUnsafeClientSecrets());
  findings.push(...scanForRealBankDeepLinks());

  const runtime = await inspectRuntimeIfConfigured();
  const report = {
    generatedAt: new Date().toISOString(),
    ok: findings.length === 0 && runtime.ok,
    findings,
    runtime,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "qr-payment-production-safety-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        findings: findings.length,
        ok: report.ok,
        runtime: runtime.status,
      },
      null,
      2,
    ),
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

function scanForUnsafeClientSecrets(): Finding[] {
  const findings: Finding[] = [];
  const files = collectFiles(path.join(process.cwd(), "src"));

  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, "utf8");

    if (
      content.includes("NEXT_PUBLIC_MOCK_PAYMENT_WEBHOOK_SECRET") ||
      content.includes("NEXT_PUBLIC_DEMO_BANK_ACCOUNT_NUMBER")
    ) {
      findings.push({
        check: "no-public-payment-secrets",
        message: `${relative} exposes payment secret/account through NEXT_PUBLIC`,
      });
    }
  }

  return findings;
}

function scanForRealBankDeepLinks(): Finding[] {
  const findings: Finding[] = [];
  const files = collectFiles(path.join(process.cwd(), "src"));
  const deepLinkPattern = /\b(vietcombank|vcb|momo|zalopay|vnpay):\/\//i;

  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, "utf8");

    if (deepLinkPattern.test(content)) {
      findings.push({
        check: "no-real-bank-deeplink",
        message: `${relative} contains a real-bank or wallet deep link pattern`,
      });
    }
  }

  return findings;
}

async function inspectRuntimeIfConfigured() {
  const baseURL = process.env.PAYQR_PRODUCTION_SAFETY_BASE_URL;

  if (!baseURL) {
    return {
      ok: true,
      status: "not-run",
    };
  }

  const invalidPaymentId = "pay_invalidproductionlock000";
  const response = await fetch(
    new URL(`/api/dev/payments/${invalidPaymentId}/simulate-success`, baseURL),
    { method: "POST" },
  );

  return {
    ok: response.status === 400 || response.status === 401 || response.status === 404,
    status: response.status,
  };
}

function collectFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

void main();
