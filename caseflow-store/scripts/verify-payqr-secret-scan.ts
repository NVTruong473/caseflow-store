import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.PAYQR_ARTIFACT_ID ?? "payqr-t01",
);
const ARTIFACT_PATH = path.join(ARTIFACT_DIR, "secret-scan.json");

const EXCLUDED_PREFIXES = [
  ".git/",
  ".next/",
  "node_modules/",
  "playwright-report/",
  "test-results/",
  ".agent/artifacts/v12-t10/private-backups/",
];
const EXCLUDED_FILES = new Set([".env", ".env.local", "package-lock.json"]);
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yml",
  ".yaml",
]);

type Finding = {
  filePath: string;
  rule: string;
};

function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const candidateFiles = execFileSync(
    "git",
    ["ls-files", "-co", "--exclude-standard"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  )
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
    .filter(shouldScan);

  const findings: Finding[] = [];
  const exactSecrets = collectExactSecretValues();

  for (const filePath of candidateFiles) {
    const absolutePath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) continue;

    const stat = fs.statSync(absolutePath);
    if (!stat.isFile() || stat.size > 1_000_000) continue;

    const text = fs.readFileSync(absolutePath, "utf8");
    const rules: Array<{ name: string; pattern: RegExp }> = [
      {
        name: "supabase-service-role-jwt",
        pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{24,}/g,
      },
      {
        name: "private-key-block",
        pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
      },
      {
        name: "raw-postgres-url",
        pattern: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/g,
      },
      {
        name: "real-mock-payment-webhook-secret",
        pattern: new RegExp(
          "MOCK_PAYMENT_WEBHOOK" +
            "_SECRET=(?!change-me-in-development\\b)(?!\\s*$)[^\\s#]+",
          "g",
        ),
      },
    ];

    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        findings.push({ filePath, rule: rule.name });
      }
    }

    for (const secretName of exactSecrets) {
      const secretValue = process.env[secretName];
      if (secretValue && text.includes(secretValue)) {
        findings.push({ filePath, rule: `exact-${secretName}` });
      }
    }
  }

  const report = {
    checkedFiles: candidateFiles.length,
    findings,
    generatedAt: new Date().toISOString(),
    ok: findings.length === 0,
  };

  fs.writeFileSync(ARTIFACT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        checkedFiles: report.checkedFiles,
        findings: findings.length,
        ok: report.ok,
      },
      null,
      2,
    ),
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

function shouldScan(filePath: string) {
  if (EXCLUDED_FILES.has(filePath)) return false;
  if (EXCLUDED_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return false;
  }

  return TEXT_EXTENSIONS.has(path.extname(filePath));
}

function collectExactSecretValues() {
  return [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
    "MOCK_PAYMENT_WEBHOOK_SECRET",
  ].filter((key) => {
    const value = process.env[key];
    return Boolean(value && value.length >= 16 && value !== "change-me-in-development");
  });
}

main();
