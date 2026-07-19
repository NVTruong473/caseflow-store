import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

type Finding = {
  file: string;
  line: number;
  pattern: string;
  text: string;
};

const rootDir = process.cwd();
const scanRoots = ["src/app", "src/components", "src/features"];
const extensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const artifactDir = path.join(
  rootDir,
  ".agent/artifacts",
  process.env.NO_DEMO_ARTIFACT_ID ?? "v14-t02",
);
const artifactPath = path.join(artifactDir, "no-demo-runtime-copy-check.json");

const prohibitedPatterns: Array<{ label: string; regex: RegExp }> = [
  { label: "demo", regex: /\bdemo\b/i },
  { label: "mock", regex: /\bmock\b/i },
  { label: "fake", regex: /\bfake\b/i },
  { label: "portfolio", regex: /\bportfolio\b/i },
  { label: "dummy", regex: /\bdummy\b/i },
  { label: "display-only", regex: /display-only/i },
  { label: "no-payment-collected", regex: /no payment collected/i },
  { label: "not-ai-api", regex: /not an ai api/i },
  {
    label: "represented-without-collecting",
    regex: /represented without collecting/i,
  },
  { label: "wallet-credentials", regex: /wallet credentials/i },
  { label: "provider-login-details", regex: /provider login details/i },
  { label: "no-card-number", regex: /no card number/i },
  { label: "khong-thu-tien", regex: /không thu tiền/i },
  { label: "khong-thu-so-the", regex: /không thu số thẻ/i },
  { label: "khong-dung-ai-api", regex: /không dùng ai api/i },
  { label: "danh-gia-gia", regex: /đánh giá giả/i },
  { label: "khong-dua-tren-so-ban", regex: /không dựa trên số bán/i },
  { label: "mo-phong", regex: /mô phỏng/i },
];

const intentionalQrDemoFiles = new Set([
  "src/app/api/dev/payments/[paymentId]/simulate-success/route.ts",
  "src/app/api/webhooks/mock-payment/route.ts",
  "src/app/checkout/payment/page.tsx",
  "src/features/checkout/checkout-page.tsx",
  "src/features/checkout/qr-payment-page.tsx",
]);

const requiredQrDemoSafetyTokens = [
  "THANH TOÁN DEMO - KHÔNG CHUYỂN TIỀN THẬT",
  "QR DEMO - KHÔNG CÓ GIÁ TRỊ THANH TOÁN THẬT",
  "DEMO PAYMENT - DO NOT TRANSFER REAL MONEY",
  "QR DEMO - NO REAL PAYMENT VALUE",
];

function collectFiles(dir: string): string[] {
  const absoluteDir = path.join(rootDir, dir);
  const entries = readdirSync(absoluteDir);
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(absoluteDir, entry);
    const relativePath = path.relative(rootDir, absolutePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(relativePath));
      continue;
    }

    if (extensions.has(path.extname(entry))) {
      files.push(relativePath);
    }
  }

  return files;
}

function findProhibitedCopy(files: string[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    const content = readFileSync(path.join(rootDir, file), "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((lineText, index) => {
      for (const pattern of prohibitedPatterns) {
        if (pattern.regex.test(lineText)) {
          if (intentionalQrDemoFiles.has(file)) {
            continue;
          }

          findings.push({
            file,
            line: index + 1,
            pattern: pattern.label,
            text: lineText.trim(),
          });
        }
      }
    });
  }

  return findings;
}

const files = scanRoots.flatMap(collectFiles).sort();
const findings = findProhibitedCopy(files);
const qrDemoSafetyFindings = verifyQrDemoSafety(files);
const report = {
  ok: findings.length === 0 && qrDemoSafetyFindings.length === 0,
  scannedFiles: files.length,
  findings: [...findings, ...qrDemoSafetyFindings],
};

mkdirSync(artifactDir, { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));

function verifyQrDemoSafety(files: string[]): Finding[] {
  const qrPaymentPage = "src/features/checkout/qr-payment-page.tsx";

  if (!files.includes(qrPaymentPage)) {
    return [];
  }

  const content = readFileSync(path.join(rootDir, qrPaymentPage), "utf8");

  return requiredQrDemoSafetyTokens
    .filter((token) => !content.includes(token))
    .map((token) => ({
      file: qrPaymentPage,
      line: 1,
      pattern: "qr-demo-safety-label",
      text: `Missing required QR payment safety label: ${token}`,
    }));
}
