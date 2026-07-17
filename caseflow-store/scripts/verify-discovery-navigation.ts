import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d27-t02");
const HOME_ANCHORS = [
  "categories",
  "featured",
  "new-arrivals",
  "translated-editions",
  "offers",
  "vietnamese-recommendations",
  "support",
] as const;

const desktopNavigation = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/#categories", label: "Categories" },
  { href: "/#translated-editions", label: "Editions" },
  { href: "/#support", label: "Support" },
  { href: "/admin/orders", label: "Admin" },
] as const;

const mobileNavigation = [
  { href: "/", label: "Trang chủ" },
  { href: "/catalog", label: "Catalog" },
  { href: "/#categories", label: "Danh mục" },
  { href: "/#translated-editions", label: "Ấn bản" },
  { href: "/#support", label: "Hỗ trợ" },
  { href: "/admin/orders", label: "Quản trị" },
  { href: "/#new-arrivals", label: "Ấn bản mới" },
  { href: "/#offers", label: "Ưu đãi hiện có" },
  { href: "/#vietnamese-recommendations", label: "Gợi ý tiếng Việt" },
] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.DISCOVERY_NAV_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const desktop = await inspectDesktopNavigation(browser, baseURL);
    const mobile = await inspectMobileNavigation(browser, baseURL);
    const recovery = await inspectRecoveryNavigation(browser, baseURL);
    const pass = {
      adminEntryPointWorks: desktop.adminEntryPointWorks,
      allDesktopLinksClickable: desktop.clickedLinks.length === desktopNavigation.length,
      allHomeAnchorsExist: Object.values(desktop.homeAnchors).every(Boolean),
      desktopNoOverflow: !desktop.hasHorizontalOverflow,
      detailBreadcrumbWorks: recovery.detailBreadcrumbWorks,
      footerLinksHaveValidTargets: desktop.footerLinksHaveValidTargets,
      mobileLinksVisible: mobile.visibleLinks.length === mobileNavigation.length,
      mobileNoOverflow: !mobile.hasHorizontalOverflow,
      notFoundRecoveryWorks: recovery.notFoundRecoveryWorks,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      desktop,
      expected: {
        desktopNavigation,
        homeAnchors: HOME_ANCHORS,
        mobileNavigation,
      },
      mobile,
      ok,
      pass,
      recovery,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "discovery-navigation-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          clickedLinks: desktop.clickedLinks.map((link) => link.label),
          mobileLinks: mobile.visibleLinks.map((link) => link.label),
        },
        null,
        2,
      ),
    );

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function inspectDesktopNavigation(browser: Browser, baseURL: string) {
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 960, width: 1440 },
  });
  await setLanguageCookie(context, baseURL, "en");
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-home-section='hero']").waitFor();

  const mainNavigation = page.getByRole("navigation", {
    name: "Main navigation",
  });
  const homeAnchors = await readHomeAnchors(page);
  const footerLinksHaveValidTargets = await footerLinksTargetExistingRoutes(
    page,
  );
  const clickedLinks = [];
  let adminEntryPointWorks = false;

  for (const item of desktopNavigation) {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const link = mainNavigation.getByRole("link", {
      exact: true,
      name: item.label,
    });
    const href = await link.getAttribute("href");
    assert(href === item.href, `Expected ${item.label} href ${item.href}`);
    await link.click();

    if (item.href === "/admin/orders") {
      await page.waitForURL(/\/admin\/(login|orders)/);
      adminEntryPointWorks = /\/admin\/(login|orders)/.test(page.url());
    } else if (item.href === "/catalog") {
      await page.waitForURL("**/catalog");
    } else if (item.href.includes("#")) {
      const hash = item.href.split("#")[1];
      await page.waitForFunction(
        (expectedHash) => window.location.hash === `#${expectedHash}`,
        hash,
      );
      assert(
        await page.evaluate((id) => Boolean(document.getElementById(id)), hash),
        `Missing target for ${item.href}`,
      );
    } else {
      await page.waitForURL("**/");
    }

    clickedLinks.push({ href: item.href, label: item.label });
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "navigation-desktop-en.png"),
  });
  const hasHorizontalOverflow = await hasOverflow(page);
  await context.close();

  return {
    adminEntryPointWorks,
    clickedLinks,
    footerLinksHaveValidTargets,
    hasHorizontalOverflow,
    homeAnchors,
  };
}

async function inspectMobileNavigation(browser: Browser, baseURL: string) {
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 900, width: 375 },
  });
  await setLanguageCookie(context, baseURL, "vi");
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Mở menu điều hướng" }).click();

  const navigation = page.getByRole("navigation", {
    name: "Điều hướng di động",
  });
  const visibleLinks = [];

  for (const item of mobileNavigation) {
    const link = navigation.getByRole("link", {
      exact: true,
      name: item.label,
    });
    assert(await link.isVisible(), `Missing mobile link ${item.label}`);
    assert(
      (await link.getAttribute("href")) === item.href,
      `Expected mobile ${item.label} href ${item.href}`,
    );
    visibleLinks.push({ href: item.href, label: item.label });
  }

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "navigation-mobile-vi-open.png"),
  });
  const hasHorizontalOverflow = await hasOverflow(page);
  await context.close();

  return {
    hasHorizontalOverflow,
    visibleLinks,
  };
}

async function inspectRecoveryNavigation(browser: Browser, baseURL: string) {
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 960, width: 1280 },
  });
  await setLanguageCookie(context, baseURL, "en");
  const page = await context.newPage();

  await page.goto("/products/a-tale-of-two-cities-english-paperback", {
    waitUntil: "domcontentloaded",
  });
  const breadcrumb = page.locator("[data-book-breadcrumb]");
  const detailBreadcrumbWorks =
    (await breadcrumb.getByRole("link", { name: "Home" }).getAttribute("href")) ===
      "/" &&
    (await breadcrumb.getByRole("link", { name: "Books" }).getAttribute("href")) ===
      "/#featured";

  await page.goto("/products/not-a-real-product", {
    waitUntil: "domcontentloaded",
  });
  const notFoundRecoveryWorks =
    (await page.getByRole("link", { name: "Browse books" }).getAttribute("href")) ===
    "/#featured";

  await context.close();

  return {
    detailBreadcrumbWorks,
    notFoundRecoveryWorks,
  };
}

async function footerLinksTargetExistingRoutes(page: Page) {
  const footerLinks = await page
    .locator("footer a")
    .evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute("href") ?? "",
        text: link.textContent?.trim() ?? "",
      })),
    );

  for (const link of footerLinks) {
    if (link.href.startsWith("/#")) {
      const id = link.href.slice(2);
      const exists = await page.evaluate(
        (anchorId) => Boolean(document.getElementById(anchorId)),
        id,
      );

      if (!exists) {
        return false;
      }
    }

    if (link.href.startsWith("#")) {
      const id = link.href.slice(1);
      const exists = await page.evaluate(
        (anchorId) => Boolean(document.getElementById(anchorId)),
        id,
      );

      if (!exists) {
        return false;
      }
    }
  }

  return true;
}

async function readHomeAnchors(page: Page) {
  return Object.fromEntries(
    await Promise.all(
      HOME_ANCHORS.map(async (id) => [
        id,
        await page.evaluate(
          (anchorId) => Boolean(document.getElementById(anchorId)),
          id,
        ),
      ]),
    ),
  );
}

async function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

async function setLanguageCookie(
  context: Awaited<ReturnType<Browser["newContext"]>>,
  baseURL: string,
  language: Language,
) {
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: baseURL,
      value: language,
    },
  ]);
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("DISCOVERY_NAV_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
