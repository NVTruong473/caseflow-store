import { loadEnvConfig } from "@next/env";
import { createServerClient } from "@supabase/ssr";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";
import type { Database } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const TASK_ID = "V13-T08";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v13-t08");
const REPORT_PATH = path.join(ARTIFACT_DIR, "admin-visual-check.json");
const BASE_URL =
  process.env.ADMIN_VISUAL_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

const SURFACES = [
  {
    name: "dashboard",
    path: "/admin",
    readySelector: "[data-admin-dashboard-page]",
  },
  {
    name: "catalog",
    path: "/admin/catalog",
    readySelector: "[data-admin-catalog-page]",
  },
] as const;

const VIEWPORTS = [
  {
    language: "vi",
    name: "mobile-vi",
    viewport: { height: 900, width: 375 },
  },
  {
    language: "en",
    name: "desktop-en",
    viewport: { height: 1100, width: 1440 },
  },
] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    const checks = [];
    for (const surface of SURFACES) {
      for (const viewport of VIEWPORTS) {
        checks.push(await inspectSurface(browser, surface, viewport));
      }
    }

    const pass = {
      adminPaletteApplied: checks.every((check) => check.pass.adminPaletteApplied),
      navigationVisible: checks.every((check) => check.pass.navigationVisible),
      noOverflow: checks.every((check) => check.pass.noOverflow),
      pageReady: checks.every((check) => check.pass.pageReady),
      scanSignalsVisible: checks.every((check) => check.pass.scanSignalsVisible),
    };
    const report = {
      taskId: TASK_ID,
      generatedAt: new Date().toISOString(),
      baseURL: BASE_URL,
      checks,
      ok: Object.values(pass).every(Boolean),
      pass,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          artifact: REPORT_PATH,
          ok: report.ok,
          pass: report.pass,
          screenshots: checks.map((check) => check.screenshotPath),
        },
        null,
        2,
      )}\n`,
    );

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function inspectSurface(
  browser: Browser,
  surface: (typeof SURFACES)[number],
  viewport: (typeof VIEWPORTS)[number],
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: viewport.viewport,
  });
  await addLanguageCookie(context, viewport.language);
  await addAdminSessionCookies(context, BASE_URL);
  const page = await context.newPage();
  await page.goto(surface.path, { waitUntil: "domcontentloaded" });
  await page.locator(surface.readySelector).waitFor({ timeout: 30_000 });
  await page.locator("[data-admin-operations-navigation]").waitFor();

  const screenshotPath = path.join(
    ARTIFACT_DIR,
    `admin-${surface.name}-${viewport.name}.png`,
  );
  const counts = await readCounts(page, surface.name);
  const classes = await readClasses(page);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    classes,
    counts,
    hasHorizontalOverflow,
    pass: {
      adminPaletteApplied:
        classes.main.includes("bg-admin-muted") &&
        classes.navigation.includes("bg-admin"),
      navigationVisible: counts.navigationItems >= 3,
      noOverflow: !hasHorizontalOverflow,
      pageReady: counts.shell === 1 && counts.ready === 1,
      scanSignalsVisible:
        surface.name === "dashboard"
          ? counts.metrics >= 4 && counts.dashboardPanels >= 4
          : counts.catalogItems > 0 && counts.catalogForm === 1,
    },
    screenshotPath,
    surface: surface.name,
    viewport: viewport.name,
  };
}

async function readCounts(page: Page, surface: string) {
  return {
    catalogForm: await page.locator("[data-admin-catalog-form]").count(),
    catalogItems: await page.locator("[data-admin-catalog-item]").count(),
    dashboardPanels:
      (await page.locator("[data-admin-dashboard-payment-summary]").count()) +
      (await page.locator("[data-admin-dashboard-order-status-summary]").count()) +
      (await page.locator("[data-admin-dashboard-top-books]").count()) +
      (await page.locator("[data-admin-dashboard-low-stock]").count()),
    metrics: await page.locator("dl div").count(),
    navigationItems: await page.locator("[data-admin-nav-item]").count(),
    ready: await page.locator(
      surface === "dashboard"
        ? "[data-admin-dashboard-page]"
        : "[data-admin-catalog-page]",
    ).count(),
    shell: await page.locator("[data-admin-shell-page]").count(),
  };
}

async function readClasses(page: Page) {
  return {
    main: (await page.locator("[data-admin-shell-page]").first().getAttribute("class")) ?? "",
    navigation:
      (await page
        .locator("[data-admin-operations-navigation]")
        .first()
        .getAttribute("class")) ?? "",
  };
}

async function addLanguageCookie(
  context: BrowserContext,
  language: (typeof VIEWPORTS)[number]["language"],
) {
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: language,
    },
  ]);
}

async function addAdminSessionCookies(context: BrowserContext, baseURL: string) {
  const email = requiredEnv("CASEFLOW_ADMIN_EMAIL");
  const password = requiredEnv("CASEFLOW_ADMIN_PASSWORD");
  let cookies: Array<{ name: string; value: string }> = [];
  const supabase = createServerClient<Database>(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(nextCookies) {
          const cookieMap = new Map(
            cookies.map((cookie) => [cookie.name, cookie.value]),
          );

          nextCookies.forEach(({ name, value }) => {
            if (value) {
              cookieMap.set(name, value);
            } else {
              cookieMap.delete(name);
            }
          });
          cookies = [...cookieMap].map(([name, value]) => ({ name, value }));
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  await context.addCookies(
    cookies.map(({ name, value }) => ({
      name,
      url: baseURL,
      value,
    })),
  );
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for V13 admin visual verification`);
  }

  return value;
}

void main();
