import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { createServerClient } from "@supabase/ssr";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import type { Database } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const TASK_ID = "V14-T11";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v14-t11");
const REPORT_PATH = path.join(ARTIFACT_DIR, "admin-operations-visual-check.json");
const BASE_URL =
  process.env.ADMIN_OPERATIONS_VISUAL_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

const SURFACES = [
  {
    name: "dashboard",
    path: "/admin",
    readySelector: "[data-admin-dashboard-page]",
  },
  {
    name: "orders",
    path: "/admin/orders",
    readySelector: "[data-admin-orders-page]",
  },
  {
    name: "catalog",
    path: "/admin/catalog",
    readySelector: "[data-admin-catalog-page]",
  },
  {
    name: "inventory",
    path: "/admin/inventory",
    readySelector: "[data-admin-inventory-page]",
  },
  {
    name: "customers",
    path: "/admin/customers",
    readySelector: "[data-admin-customers-page]",
  },
] as const;

const VIEWPORTS = [
  {
    language: "vi" satisfies Language,
    name: "mobile-vi",
    viewport: { height: 900, width: 390 },
  },
  {
    language: "en" satisfies Language,
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
      noHorizontalOverflow: checks.every((check) => check.pass.noHorizontalOverflow),
      operationsRailVisible: checks.every(
        (check) => check.pass.operationsRailVisible,
      ),
      roleBoundaryVisible: checks.every((check) => check.pass.roleBoundaryVisible),
      surfaceTaskPanelsVisible: checks.every(
        (check) => check.pass.surfaceTaskPanelsVisible,
      ),
    };
    const report = {
      taskId: TASK_ID,
      baseURL: BASE_URL,
      checks,
      generatedAt: new Date().toISOString(),
      ok: Object.values(pass).every(Boolean),
      pass,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          artifact: REPORT_PATH,
          ok: report.ok,
          pass,
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
  await page.locator(surface.readySelector).waitFor({ timeout: 45_000 });
  await page.locator("[data-admin-operations-navigation]").waitFor({
    timeout: 45_000,
  });
  await waitForSurfaceSettled(page, surface.name);

  const screenshotPath = path.join(
    ARTIFACT_DIR,
    `admin-v14-${surface.name}-${viewport.name}.png`,
  );
  const counts = await readCounts(page, surface.name);
  const classes = await readClasses(page);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  await page.screenshot({
    caret: "initial",
    fullPage: true,
    path: screenshotPath,
  });
  await context.close();

  return {
    classes,
    counts,
    hasHorizontalOverflow,
    pass: {
      adminPaletteApplied:
        classes.main.includes("bg-admin-muted") &&
        classes.navigation.includes("bg-admin"),
      noHorizontalOverflow: !hasHorizontalOverflow,
      operationsRailVisible:
        counts.operationsRail === 1 && counts.operationsRailItems >= 4,
      roleBoundaryVisible: counts.roleBadges >= 1 && counts.navigationItems >= 3,
      surfaceTaskPanelsVisible: taskPanelPass(surface.name, counts),
    },
    screenshotPath,
    surface: surface.name,
    viewport: viewport.name,
  };
}

async function waitForSurfaceSettled(
  page: Page,
  surface: (typeof SURFACES)[number]["name"],
) {
  if (surface === "orders") {
    await page
      .locator(
        "[data-admin-orders-summary], [data-admin-orders-empty], [data-admin-orders-auth-required], [data-admin-orders-error]",
      )
      .first()
      .waitFor({ timeout: 45_000 });
  }
}

async function readCounts(
  page: Page,
  surface: (typeof SURFACES)[number]["name"],
) {
  return {
    catalogForm: await page.locator("[data-admin-catalog-form]").count(),
    catalogItems: await page.locator("[data-admin-catalog-item]").count(),
    customerDetail: await page.locator("[data-admin-customer-detail]").count(),
    customerItems: await page.locator("[data-admin-customer-item]").count(),
    dashboardPanels:
      (await page.locator("[data-admin-dashboard-payment-summary]").count()) +
      (await page.locator("[data-admin-dashboard-order-status-summary]").count()) +
      (await page.locator("[data-admin-dashboard-top-books]").count()) +
      (await page.locator("[data-admin-dashboard-low-stock]").count()),
    dashboardStatusRails: await page
      .locator("[data-admin-dashboard-status-rail]")
      .count(),
    inventoryAdjustForm: await page
      .locator("[data-admin-inventory-adjust-form]")
      .count(),
    inventoryAdjustments: await page
      .locator("[data-admin-inventory-adjustments]")
      .count(),
    inventoryItems: await page.locator("[data-admin-inventory-item]").count(),
    navigationItems: await page.locator("[data-admin-nav-item]").count(),
    operationsRail: await page.locator("[data-admin-operations-rail]").count(),
    operationsRailItems: await page
      .locator("[data-admin-operations-rail-item]")
      .count(),
    orderDetail: await page.locator("[data-admin-order-detail]").count(),
    orderFilters: await page.locator("[data-admin-orders-filters]").count(),
    orderList: await page.locator("[data-admin-orders-list]").count(),
    orderSummary: await page.locator("[data-admin-orders-summary]").count(),
    ready: await page.locator(readySelectorFor(surface)).count(),
    roleBadges: await page.locator("[data-admin-role-badge]").count(),
    shellMetrics: await page.locator("[data-admin-shell-metric]").count(),
  };
}

async function readClasses(page: Page) {
  return {
    main:
      (await page
        .locator("[data-admin-shell-page], [data-admin-orders-page]")
        .first()
        .getAttribute("class")) ?? "",
    navigation:
      (await page
        .locator("[data-admin-operations-navigation]")
        .first()
        .getAttribute("class")) ?? "",
  };
}

function readySelectorFor(surface: (typeof SURFACES)[number]["name"]) {
  return SURFACES.find((item) => item.name === surface)?.readySelector ?? "main";
}

function taskPanelPass(
  surface: (typeof SURFACES)[number]["name"],
  counts: Awaited<ReturnType<typeof readCounts>>,
) {
  switch (surface) {
    case "catalog":
      return counts.catalogForm === 1 && counts.catalogItems > 0;
    case "customers":
      return counts.customerDetail === 1 && counts.customerItems > 0;
    case "dashboard":
      return (
        counts.dashboardPanels >= 4 &&
        counts.dashboardStatusRails >= 4 &&
        counts.shellMetrics >= 4
      );
    case "inventory":
      return (
        counts.inventoryAdjustForm === 1 &&
        counts.inventoryAdjustments === 1 &&
        counts.inventoryItems > 0
      );
    case "orders":
      return (
        counts.orderFilters === 1 &&
        counts.orderSummary === 1 &&
        counts.orderList === 1 &&
        counts.orderDetail === 1
      );
  }
}

async function addLanguageCookie(context: BrowserContext, language: Language) {
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
    throw new Error(`${name} is required for V14 admin operations visual verification`);
  }

  return value;
}

void main();
