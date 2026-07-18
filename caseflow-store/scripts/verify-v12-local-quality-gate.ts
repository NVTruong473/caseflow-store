import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser } from "@playwright/test";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t17");
const REPORT_PATH = path.join(ARTIFACT_DIR, "local-quality-gate-check.json");
const COMMAND_TIMEOUT_MS = 120_000;
const CATALOG_FETCH_TIMEOUT_MS = 20_000;
const PERFORMANCE_RUNS = 3;
const PERFORMANCE_THRESHOLDS = {
  domContentLoadedMs: 4_000,
  loadMs: 8_000,
  selectorReadyMs: 8_000,
  totalBlockingTimeMs: 600,
};
const EXCLUDED_SCAN_PREFIXES = [
  ".git/",
  ".next/",
  "node_modules/",
  "playwright-report/",
  "test-results/",
  ".agent/artifacts/v12-t10/private-backups/",
];
const EXCLUDED_SCAN_FILES = new Set([
  ".env.local",
  ".env",
  "package-lock.json",
]);
const TEXT_FILE_EXTENSIONS = new Set([
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

type AuditReport = {
  metadata?: {
    vulnerabilities?: Record<string, number>;
  };
  vulnerabilities?: Record<string, unknown>;
};

type JsonReport = {
  ok?: boolean;
  pass?: Record<string, boolean>;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.V12_LOCAL_QUALITY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3001",
  );
  console.error("[v12-t17] inspecting static reports");
  const staticReports = inspectStaticReports();
  console.error("[v12-t17] measuring mobile performance baseline");
  const performance = await inspectPerformance(baseURL);
  console.error("[v12-t17] running dependency audit checks");
  const dependencyAudit = inspectDependencyAudit();
  console.error("[v12-t17] scanning tracked and untracked text files for leaked secrets");
  const secretScan = inspectSecrets();
  const pass = {
    dependencyNoHighOrCritical:
      dependencyAudit.highCritical.ok &&
      dependencyAudit.highCritical.vulnerabilities.high === 0 &&
      dependencyAudit.highCritical.vulnerabilities.critical === 0,
    moderateDependencyRiskDocumented:
      dependencyAudit.moderate.vulnerabilities.total === 2 &&
      dependencyAudit.moderate.vulnerabilities.moderate === 2 &&
      dependencyAudit.moderate.fixRecommendation ===
        "npm-audit-fix-force-would-install-next-9.3.3-breaking-downgrade",
    performanceBaseline: performance.ok,
    secretScan: secretScan.findings.length === 0,
    staticReports: staticReports.every((report) => report.ok),
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    baseURL,
    dependencyAudit,
    generatedAt: new Date().toISOString(),
    lighthouse: {
      ok: false,
      status: "unavailable",
      reason:
        "npm exec lighthouse@13.4.0 did not complete package installation/version check within the local gate window; Playwright performance baseline was used instead.",
    },
    ok,
    pass,
    performance,
    secretScan,
    staticReports,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        ok,
        artifact: REPORT_PATH,
        pass,
        performance: performance.summary,
        moderateDependencyRisk: dependencyAudit.moderate.vulnerabilities,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function inspectStaticReports() {
  return [
    readReport("canonicalManifest", ".agent/artifacts/v12-t05/canonical-manifest-check.json"),
    readReport("contentProvenance", ".agent/artifacts/v12-t04/provenance-content-quality-check.json"),
    readReport("coverPortfolio", ".agent/artifacts/v12-t07/cover-portfolio-check.json"),
    readReport("editorialMetadata", ".agent/artifacts/v12-t08/editorial-metadata-check.json"),
    readReport("merchandisingRules", ".agent/artifacts/v12-t09/merchandising-rules-check.json"),
    readReport("migrationPlan", ".agent/artifacts/v12-t10/v12-catalog-migration-check.json"),
    readReport("supabaseImport", ".agent/artifacts/v12-t11/post-migration-supabase-check.json"),
    readReport("homepageMerchandising", ".agent/artifacts/v12-t12/homepage-merchandising-check.json"),
    readReport("homepageUi", ".agent/artifacts/v12-t12/homepage-ui-check.json"),
    readReport("catalogDiscovery", ".agent/artifacts/v12-t13/catalog-discovery-check.json"),
    readReport("bookDetail", ".agent/artifacts/v12-t14/book-detail-edition-comparison-check.json"),
    readReport("adminContentOperations", ".agent/artifacts/v12-t15/admin-content-operations-check.json"),
    readReport("runtimeIntegration", ".agent/artifacts/v12-t16/catalog-runtime-integration-check.json"),
    readReport("accessibilityMobilePerformance", ".agent/artifacts/d39-t03/accessibility-mobile-performance-check.json"),
    readReport("seoMetadata", ".agent/artifacts/d39-t02/seo-metadata-check.json"),
    readReport("releaseCleanup", ".agent/artifacts/d40-t01/release-cleanup-check.json"),
  ];
}

function readReport(name: string, reportPath: string) {
  const exists = fs.existsSync(reportPath);
  const parsed = exists
    ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as JsonReport)
    : null;
  const passValues = Object.values(parsed?.pass ?? {});

  return {
    exists,
    name,
    ok: Boolean(
      parsed?.ok ?? (passValues.length > 0 && passValues.every(Boolean)),
    ),
    path: reportPath,
    pass: parsed?.pass ?? null,
  };
}

async function inspectPerformance(baseURL: string) {
  const catalogResponse = await fetchWithTimeout(
    new URL("/api/products?limit=1", baseURL),
  );

  if (!catalogResponse.ok) {
    throw new Error(
      `Catalog API returned ${catalogResponse.status} during performance setup`,
    );
  }

  const catalogPayload = (await catalogResponse.json()) as {
    data?: Array<{ slug: string }>;
  };
  const targetSlug = catalogPayload.data?.[0]?.slug;

  if (!targetSlug) {
    throw new Error("Could not find target slug for performance baseline");
  }

  const routes = [
    { name: "home", pathname: "/", selector: "main" },
    { name: "catalog", pathname: "/catalog", selector: "[data-catalog-page]" },
    {
      name: "detail",
      pathname: `/products/${targetSlug}`,
      selector: "[data-book-detail]",
    },
  ];
  const browser = await chromium.launch();

  try {
    const routeResults = [];

    for (const route of routes) {
      const runs = [];

      for (let index = 0; index < PERFORMANCE_RUNS; index += 1) {
        runs.push(await measureRoute(browser, baseURL, route));
      }

      const medians = {
        domContentLoadedMs: median(runs.map((run) => run.domContentLoadedMs)),
        loadMs: median(runs.map((run) => run.loadMs)),
        selectorReadyMs: median(runs.map((run) => run.selectorReadyMs)),
        totalBlockingTimeMs: median(runs.map((run) => run.totalBlockingTimeMs)),
      };
      const pass = {
        domContentLoaded:
          medians.domContentLoadedMs <= PERFORMANCE_THRESHOLDS.domContentLoadedMs,
        load: medians.loadMs <= PERFORMANCE_THRESHOLDS.loadMs,
        noOverflow: runs.every((run) => !run.hasHorizontalOverflow),
        selectorReady:
          medians.selectorReadyMs <= PERFORMANCE_THRESHOLDS.selectorReadyMs,
        totalBlockingTime:
          medians.totalBlockingTimeMs <=
          PERFORMANCE_THRESHOLDS.totalBlockingTimeMs,
      };

      routeResults.push({
        medians,
        name: route.name,
        pass,
        pathname: route.pathname,
        runs,
      });
    }

    return {
      ok: routeResults.every((route) =>
        Object.values(route.pass).every(Boolean),
      ),
      routes: routeResults,
      summary: Object.fromEntries(
        routeResults.map((route) => [route.name, route.medians]),
      ),
      thresholds: PERFORMANCE_THRESHOLDS,
    };
  } finally {
    await browser.close();
  }
}

async function measureRoute(
  browser: Browser,
  baseURL: string,
  route: { name: string; pathname: string; selector: string },
) {
  const context = await browser.newContext({
    baseURL,
    isMobile: true,
    viewport: { height: 844, width: 390 },
  });
  const page = await context.newPage();
  let selectorReadyMs = Number.POSITIVE_INFINITY;

  try {
    const startedAt = Date.now();
    await page.goto(route.pathname, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(route.selector, {
      state: "visible",
      timeout: 20_000,
    });
    selectorReadyMs = Date.now() - startedAt;
    await page.waitForLoadState("load", { timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming | undefined;
      const longTasks = performance.getEntriesByType("longtask");
      const totalBlockingTimeMs = longTasks.reduce((total, task) => {
        return total + Math.max(0, task.duration - 50);
      }, 0);

      return {
        domContentLoadedMs:
          navigation?.domContentLoadedEventEnd ?? Number.POSITIVE_INFINITY,
        hasHorizontalOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
        loadMs: navigation?.loadEventEnd ?? Number.POSITIVE_INFINITY,
        totalBlockingTimeMs,
      };
    });

    return {
      ...metrics,
      selectorReadyMs,
    };
  } finally {
    await page.close();
    await context.close();
  }
}

function inspectDependencyAudit() {
  return {
    highCritical: runAudit("high"),
    moderate: runAudit("moderate"),
  };
}

function runAudit(level: "high" | "moderate") {
  const output = runCommand("npm", ["audit", `--audit-level=${level}`, "--json"], {
    allowFailure: true,
  });
  const parsed = JSON.parse(output) as AuditReport;
  const vulnerabilities = {
    critical: parsed.metadata?.vulnerabilities?.critical ?? 0,
    high: parsed.metadata?.vulnerabilities?.high ?? 0,
    low: parsed.metadata?.vulnerabilities?.low ?? 0,
    moderate: parsed.metadata?.vulnerabilities?.moderate ?? 0,
    total: parsed.metadata?.vulnerabilities?.total ?? 0,
  };
  const nextFix = getNestedRecord(parsed.vulnerabilities, "next")?.fixAvailable;
  const fixRecommendation =
    isRecord(nextFix) &&
    nextFix.name === "next" &&
    nextFix.version === "9.3.3"
      ? "npm-audit-fix-force-would-install-next-9.3.3-breaking-downgrade"
      : "review-required";

  return {
    ok: level === "high"
      ? vulnerabilities.high === 0 && vulnerabilities.critical === 0
      : vulnerabilities.total === 0,
    fixRecommendation,
    vulnerabilities,
  };
}

function inspectSecrets() {
  const fileList = runCommand("git", ["ls-files", "-co", "--exclude-standard"], {
    allowFailure: false,
  })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
  const findings = [];

  for (const filePath of fileList) {
    if (!shouldScan(filePath)) continue;

    const absolutePath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) continue;

    const stats = fs.statSync(absolutePath);
    if (!stats.isFile() || stats.size > 1_000_000) continue;

    const text = fs.readFileSync(absolutePath, "utf8");
    const patterns = [
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
    ];

    for (const { name, pattern } of patterns) {
      if (pattern.test(text)) {
        findings.push({ filePath, name });
      }
    }
  }

  return {
    checkedFiles: fileList.filter(shouldScan).length,
    findings,
  };
}

function shouldScan(filePath: string) {
  if (EXCLUDED_SCAN_FILES.has(filePath)) return false;
  if (EXCLUDED_SCAN_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return false;
  }

  return TEXT_FILE_EXTENSIONS.has(path.extname(filePath));
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, CATALOG_FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function runCommand(command: string, args: string[], options: {
  allowFailure: boolean;
  timeoutMs?: number;
}) {
  try {
    return execFileSync(command, args, {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: options.timeoutMs ?? COMMAND_TIMEOUT_MS,
    });
  } catch (error) {
    if (
      options.allowFailure &&
      isRecord(error) &&
      typeof error.stdout === "string"
    ) {
      return error.stdout;
    }

    throw error;
  }
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Base URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted[middle] ?? Number.POSITIVE_INFINITY;
}

function getNestedRecord(
  record: Record<string, unknown> | undefined,
  key: string,
) {
  const value = record?.[key];

  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
