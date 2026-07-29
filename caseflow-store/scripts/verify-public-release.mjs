import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const SOURCE_ROOT = process.cwd();
const PUBLIC_ROOT = path.resolve(SOURCE_ROOT, "..", "dist-public");
const EXPECTED_PUBLIC_VERSION =
  process.env.PUBLIC_RELEASE_VERSION ?? "1.18.2";
const OUTPUT_PATH = path.resolve(
  SOURCE_ROOT,
  "..",
  "project-documentation-output",
  "validation",
  "public-release-validation.json",
);
const TREE_OUTPUT_PATH = path.resolve(
  SOURCE_ROOT,
  "..",
  "project-documentation-output",
  "validation",
  "dist-public-tree.txt",
);

const EXPECTED_TOP_LEVEL = new Set([
  ".env.example",
  ".gitignore",
  "LICENSE",
  "README.md",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "public",
  "src",
  "supabase",
  "tsconfig.json",
]);

const FORBIDDEN_PATH_PARTS = [
  ".agent",
  ".ai",
  ".codex",
  ".idea",
  ".next",
  ".vercel",
  ".vscode",
  "coverage",
  "docs",
  "node_modules",
  "notes",
  "plans",
  "playwright-report",
  "prompts",
  "test-results",
  "tests",
];

const FORBIDDEN_FILE_NAMES = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "DESIGN.md",
  "PLANS.md",
  "PROMPTS.md",
  "SECURITY.md",
  "SKILL.md",
  "SUPPORT.md",
  "TASKS.md",
  ".env.local",
]);

const FORBIDDEN_EXTENSIONS = new Set([
  ".crt",
  ".key",
  ".p12",
  ".pem",
  ".pfx",
]);

const TEXT_EXTENSIONS = new Set([
  "",
  ".css",
  ".d.ts",
  ".example",
  ".gitignore",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".sql",
  ".svg",
  ".ts",
  ".tsx",
  ".txt",
  ".vtt",
]);

const INTERNAL_CONTENT_PATTERNS = [
  { label: "AI agent", pattern: /\bAI agent\b/i },
  { label: "ChatGPT", pattern: /\bChatGPT\b/i },
  { label: "Codex", pattern: /\bCodex\b/i },
  { label: "OpenAI", pattern: /\bOpenAI\b/i },
  { label: "local macOS home", pattern: /\/Users\/[^/\s]+/ },
  { label: "local Windows home", pattern: /[A-Z]:\\Users\\[^\\\s]+/i },
  { label: "internal agent path", pattern: /(?:^|[/\\])\.agent(?:[/\\]|$)/m },
];

const SECRET_PATTERNS = [
  {
    label: "private key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  { label: "GitHub token", pattern: /\bgh[opusr]_[A-Za-z0-9_]{20,}\b/ },
  { label: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    label: "database URL with password",
    pattern: /\bpostgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/i,
  },
  {
    label: "JWT-like token",
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  },
];

const SENSITIVE_ENV_NAMES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_URL",
  "CASEFLOW_ADMIN_PASSWORD",
  "MOCK_PAYMENT_WEBHOOK_SECRET",
  "CHECKOUT_EXPERIENCE_TOKEN_SECRET",
  "OPERATIONS_PASSWORD_CHANGE_SECRET",
  "RESEND_API_KEY",
  "TWILIO_AUTH_TOKEN",
  "OTP_HASH_SECRET",
  "NOTIFICATION_DISPATCH_SECRET",
  "SMTP_PASS",
];

async function main() {
  const files = await listFiles(PUBLIC_ROOT);
  const topLevel = await fs.readdir(PUBLIC_ROOT);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));
  const forbiddenPaths = [];
  const internalContentFindings = [];
  const secretFindings = [];
  const sensitiveValues = await readSensitiveLocalValues();

  for (const file of files) {
    const relative = path.relative(PUBLIC_ROOT, file).replaceAll(path.sep, "/");
    const segments = relative.split("/");
    const extension = path.extname(file).toLowerCase();

    if (
      segments.some((segment) => FORBIDDEN_PATH_PARTS.includes(segment)) ||
      FORBIDDEN_FILE_NAMES.has(path.basename(file)) ||
      FORBIDDEN_EXTENSIONS.has(extension)
    ) {
      forbiddenPaths.push(relative);
    }

    if (!TEXT_EXTENSIONS.has(extension) && path.basename(file) !== "LICENSE") {
      continue;
    }

    const text = await fs.readFile(file, "utf8");
    for (const candidate of INTERNAL_CONTENT_PATTERNS) {
      if (candidate.pattern.test(text)) {
        internalContentFindings.push({
          file: relative,
          finding: candidate.label,
        });
      }
    }
    for (const candidate of SECRET_PATTERNS) {
      if (candidate.pattern.test(text)) {
        secretFindings.push({
          file: relative,
          finding: candidate.label,
        });
      }
    }
    for (const [name, value] of sensitiveValues) {
      if (text.includes(value)) {
        secretFindings.push({
          file: relative,
          finding: `local ${name} value`,
        });
      }
    }
  }

  const packageJson = JSON.parse(
    await fs.readFile(path.join(PUBLIC_ROOT, "package.json"), "utf8"),
  );
  const packageLock = JSON.parse(
    await fs.readFile(path.join(PUBLIC_ROOT, "package-lock.json"), "utf8"),
  );
  const lockRoot = packageLock.packages?.[""] ?? {};
  const seedText = await fs.readFile(
    path.join(PUBLIC_ROOT, "supabase", "catalog-seed.sql"),
    "utf8",
  );
  const readmeText = await fs.readFile(
    path.join(PUBLIC_ROOT, "README.md"),
    "utf8",
  );
  const requiredReadmeSections = [
    "## Features",
    "## Tech stack",
    "## Architecture",
    "## Folder structure",
    "## Installation",
    "## Environment variables",
    "## Database setup",
    "## Running locally",
    "## Docker usage",
    "## Build",
    "## Production deployment",
    "## Testing",
    "## License",
  ];
  const runtimeParityFindings = await inspectRuntimeParity(files);
  const currentRuntimeFiles = [
    "src/features/customer/customer-orders-page.tsx",
    "src/features/checkout/transfer-experience-page.tsx",
    "src/lib/repositories/supabase-checkout-experience.ts",
    "src/types/checkout-experience.ts",
  ];
  const currentRuntimeMissing = [];

  for (const relativePath of currentRuntimeFiles) {
    if (!(await exists(path.join(PUBLIC_ROOT, relativePath)))) {
      currentRuntimeMissing.push(relativePath);
    }
  }

  const checks = {
    topLevelAllowlist:
      topLevel.length === EXPECTED_TOP_LEVEL.size &&
      topLevel.every((entry) => EXPECTED_TOP_LEVEL.has(entry)),
    readmeIsOnlyMarkdown:
      markdownFiles.length === 1 &&
      path.basename(markdownFiles[0]) === "README.md",
    noForbiddenPaths: forbiddenPaths.length === 0,
    noInternalContent: internalContentFindings.length === 0,
    noSecrets: secretFindings.length === 0,
    noBuildArtifacts:
      !topLevel.includes(".next") && !topLevel.includes("node_modules"),
    publicPackageHasFocusedScripts:
      Object.keys(packageJson.scripts).sort().join(",") ===
      ["build", "dev", "lint", "start", "typecheck"].sort().join(","),
    publicPackageVersionMatchesRelease:
      packageJson.version === EXPECTED_PUBLIC_VERSION &&
      packageLock.version === EXPECTED_PUBLIC_VERSION &&
      lockRoot.version === EXPECTED_PUBLIC_VERSION,
    publicPackageLockMatchesManifest:
      packageLock.name === packageJson.name &&
      lockRoot.name === packageJson.name &&
      JSON.stringify(lockRoot.dependencies ?? {}) ===
        JSON.stringify(packageJson.dependencies ?? {}) &&
      JSON.stringify(lockRoot.devDependencies ?? {}) ===
        JSON.stringify(packageJson.devDependencies ?? {}),
    publicPackageExcludesBrowserTests:
      !packageJson.devDependencies?.["@playwright/test"] &&
      !lockRoot.devDependencies?.["@playwright/test"] &&
      !packageLock.packages?.["node_modules/@playwright/test"],
    publicPackageExcludesDatabaseTooling:
      !packageJson.devDependencies?.pg &&
      !packageJson.devDependencies?.["@types/pg"] &&
      !lockRoot.devDependencies?.pg &&
      !lockRoot.devDependencies?.["@types/pg"],
    currentRuntimeFilesPresent: currentRuntimeMissing.length === 0,
    exportedRuntimeMatchesWorkingTree: runtimeParityFindings.length === 0,
    catalogSeedHas500ActiveEditions: seedText.includes(
      "-- Active editions: 500.",
    ),
    catalogSeedExcludesCustomerData:
      !/insert into public\."?(?:profiles|orders|order_items|payments|customer_signup_vouchers|notifications|notification_deliveries)"?/i.test(
        seedText,
      ),
    readmeHasRequiredSections: requiredReadmeSections.every((section) =>
      readmeText.includes(section),
    ),
  };
  const result = {
    checks,
    fileCount: files.length,
    forbiddenPaths,
    internalContentFindings,
    markdownFiles: markdownFiles.map((file) =>
      path.relative(PUBLIC_ROOT, file).replaceAll(path.sep, "/"),
    ),
    currentRuntimeMissing,
    expectedPublicVersion: EXPECTED_PUBLIC_VERSION,
    runtimeParityFindings,
    secretFindings,
    status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
    topLevel: topLevel.sort(),
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(result, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    TREE_OUTPUT_PATH,
    `${[
      "dist-public/",
      ...files.map(
        (file) =>
          `  ${path.relative(PUBLIC_ROOT, file).replaceAll(path.sep, "/")}`,
      ),
    ].join("\n")}\n`,
    "utf8",
  );
  console.log(JSON.stringify(result, null, 2));
  raiseOnFailure(result);
}

async function inspectRuntimeParity(publicFiles) {
  const findings = [];
  const parityRoots = ["public/", "src/"];

  for (const publicFile of publicFiles) {
    const relative = path
      .relative(PUBLIC_ROOT, publicFile)
      .replaceAll(path.sep, "/");

    if (!parityRoots.some((root) => relative.startsWith(root))) {
      continue;
    }

    const sourceFile = path.join(SOURCE_ROOT, relative);

    if (!(await exists(sourceFile))) {
      findings.push({ file: relative, reason: "missing-working-tree-source" });
      continue;
    }

    const [publicBytes, sourceBytes] = await Promise.all([
      fs.readFile(publicFile),
      fs.readFile(sourceFile),
    ]);

    if (sha256(publicBytes) !== sha256(sourceBytes)) {
      findings.push({ file: relative, reason: "content-mismatch" });
    }
  }

  return findings;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function readSensitiveLocalValues() {
  const envPath = path.join(SOURCE_ROOT, ".env.local");
  const values = [];
  let text = "";

  try {
    text = await fs.readFile(envPath, "utf8");
  } catch {
    return values;
  }

  const parsed = new Map(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.trimStart().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return separator < 0
          ? [line.trim(), ""]
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

  for (const name of SENSITIVE_ENV_NAMES) {
    const value = parsed.get(name);
    if (value && value.length >= 8) {
      values.push([name, value]);
    }
  }
  return values;
}

async function listFiles(directory) {
  const files = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

async function exists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function raiseOnFailure(result) {
  if (result.status !== "PASS") {
    process.exitCode = 1;
  }
}

await main();
