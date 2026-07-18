import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

const RELEASE_TASK_ID = process.env.PRODUCTION_RELEASE_TASK_ID ?? "v12-t18";
const ARTIFACT_DIR = path.join(".agent", "artifacts", RELEASE_TASK_ID);
const REPORT_PATH = path.join(ARTIFACT_DIR, "production-release-smoke.json");
const LANGUAGE_COOKIE = "caseflow-books.language";
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const PLACEHOLDER_COVER_PATH = "/images/books/placeholders/book-cover-placeholder.svg";
const REQUEST_TIMEOUT_MS = 20_000;

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type CatalogItem = {
  coverAsset?: {
    altText?: { en?: string; vi?: string };
    path?: string;
    source?: string;
  } | null;
  edition: {
    id: string;
    displayTitle: string;
    format: string;
    language: "en" | "vi";
    priceVnd: number;
    stockQuantity: number;
    summary?: { en?: string; vi?: string } | null;
  };
  slug: string;
  title: string;
};

type HttpCheck = {
  body: string;
  status: number;
};

type JsonCheck<TData> = {
  payload: ApiResponse<TData>;
  status: number;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.PRODUCTION_RELEASE_BASE_URL ??
      process.env.V12_PRODUCTION_BASE_URL ??
      "https://caseflow-store.vercel.app",
  );
  const deployment = {
    canonicalUrl: baseURL,
    deploymentId:
      process.env.PRODUCTION_RELEASE_DEPLOYMENT_ID ??
      process.env.V12_DEPLOYMENT_ID ??
      null,
    deploymentUrl:
      process.env.PRODUCTION_RELEASE_DEPLOYMENT_URL ??
      process.env.V12_DEPLOYMENT_URL ??
      null,
    inspectorUrl:
      process.env.PRODUCTION_RELEASE_INSPECTOR_URL ??
      process.env.V12_INSPECTOR_URL ??
      null,
    taskId: RELEASE_TASK_ID,
  };
  const catalog = await fetchJson<CatalogItem[]>(
    new URL("/api/products?limit=100", baseURL),
  );
  const catalogItems = catalog.payload.data ?? [];
  const englishTarget = catalogItems.find((item) => item.edition.language === "en");
  const vietnameseTarget = catalogItems.find((item) => item.edition.language === "vi");

  if (!englishTarget || !vietnameseTarget) {
    throw new Error("Production catalog does not contain both English and Vietnamese targets");
  }

  const http = await inspectHttp(baseURL, englishTarget, vietnameseTarget);
  const catalogQuality = await inspectCatalogQuality(baseURL, catalog, catalogItems);
  const browser = await inspectBrowser(baseURL, englishTarget, vietnameseTarget);
  const pass = {
    adminBoundary: http.pass.adminUnauthorized && browser.pass.adminBoundary,
    assistant: browser.pass.assistant,
    canonicalAlias: http.pass.home && http.pass.robots && http.pass.sitemap,
    cartAndCheckoutBoundary: browser.pass.cartEntry && browser.pass.checkoutBoundary,
    catalogQuality: Object.values(catalogQuality.pass).every(Boolean),
    customerBoundary: http.pass.customerUnauthorized,
    detailPages: http.pass.englishDetail && http.pass.vietnameseDetail && browser.pass.detailPages,
    languageMode: browser.pass.languageMode,
    publicPages: http.pass.account && http.pass.catalogPage && http.pass.tracking,
  };
  const ok = Object.values(pass).every(Boolean);
  const report = {
    baseURL,
    browser,
    catalogQuality,
    deployment,
    generatedAt: new Date().toISOString(),
    http,
    ok,
    pass,
    targets: {
      en: {
        id: englishTarget.edition.id,
        slug: englishTarget.slug,
        title: englishTarget.title,
      },
      vi: {
        id: vietnameseTarget.edition.id,
        slug: vietnameseTarget.slug,
        title: vietnameseTarget.title,
      },
    },
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        ok,
        artifact: REPORT_PATH,
        pass,
        catalogQuality: catalogQuality.summary,
        screenshots: browser.screenshots,
      },
      null,
      2,
    ),
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

async function inspectHttp(
  baseURL: string,
  englishTarget: CatalogItem,
  vietnameseTarget: CatalogItem,
) {
  const checks = {
    account: await fetchText(new URL("/account", baseURL)),
    adminOrders: await fetchJson<unknown>(new URL("/api/admin/orders", baseURL)),
    adminShelves: await fetchJson<unknown>(
      new URL("/api/admin/merchandising/shelves", baseURL),
    ),
    catalogPage: await fetchText(new URL("/catalog", baseURL)),
    customerOrders: await fetchJson<unknown>(
      new URL("/api/customer/orders", baseURL),
    ),
    englishDetail: await fetchText(new URL(`/products/${englishTarget.slug}`, baseURL)),
    home: await fetchText(new URL("/", baseURL)),
    robots: await fetchText(new URL("/robots.txt", baseURL)),
    sitemap: await fetchText(new URL("/sitemap.xml", baseURL)),
    tracking: await fetchText(new URL("/orders/track", baseURL)),
    vietnameseDetail: await fetchText(
      new URL(`/products/${vietnameseTarget.slug}`, baseURL),
    ),
  };
  const pass = {
    account: checks.account.status === 200 && /Account|Tài khoản/i.test(checks.account.body),
    adminUnauthorized:
      checks.adminOrders.status === 401 &&
      checks.adminOrders.payload.error?.code === "UNAUTHORIZED" &&
      checks.adminShelves.status === 401 &&
      checks.adminShelves.payload.error?.code === "UNAUTHORIZED",
    catalogPage:
      checks.catalogPage.status === 200 &&
      checks.catalogPage.body.includes("data-catalog-page"),
    customerUnauthorized:
      checks.customerOrders.status === 401 &&
      checks.customerOrders.payload.error?.code === "UNAUTHORIZED",
    englishDetail:
      checks.englishDetail.status === 200 &&
      isPublicHtmlSafe(checks.englishDetail.body),
    home:
      checks.home.status === 200 &&
      checks.home.body.includes("CaseFlow Books") &&
      checks.home.body.includes("data-book-assistant-toggle"),
    robots:
      checks.robots.status === 200 &&
      checks.robots.body.includes("Disallow: /admin") &&
      checks.robots.body.includes(`${baseURL}/sitemap.xml`),
    sitemap:
      checks.sitemap.status === 200 &&
      checks.sitemap.body.includes(`${baseURL}/products/${englishTarget.slug}`) &&
      checks.sitemap.body.includes(`${baseURL}/products/${vietnameseTarget.slug}`) &&
      !checks.sitemap.body.includes("/admin"),
    tracking:
      checks.tracking.status === 200 &&
      /Track|Theo dõi|Tra cứu/i.test(checks.tracking.body),
    vietnameseDetail:
      checks.vietnameseDetail.status === 200 &&
      isPublicHtmlSafe(checks.vietnameseDetail.body),
  };

  return {
    pass,
    status: Object.fromEntries(
      Object.entries(checks).map(([key, value]) => [key, value.status]),
    ),
  };
}

async function inspectCatalogQuality(
  baseURL: string,
  catalog: JsonCheck<CatalogItem[]>,
  catalogItems: CatalogItem[],
) {
  const languageCounts = catalogItems.reduce(
    (counts, item) => {
      counts[item.edition.language] += 1;
      return counts;
    },
    { en: 0, vi: 0 },
  );
  const publicFieldLeaks = catalogItems.filter((item) => {
    const serialized = JSON.stringify(item);
    return /sourceEditionKey|sourceReviewStatus|reviewerNote|rightsAnalysis/i.test(serialized);
  });
  const placeholderCovers = catalogItems.filter(
    (item) => item.coverAsset?.path === PLACEHOLDER_COVER_PATH,
  );
  const missingBilingualCopy = catalogItems.filter((item) => {
    const summary = item.edition.summary;
    const alt = item.coverAsset?.altText;
    return !summary?.en || !summary.vi || !alt?.en || !alt.vi;
  });
  const invalidCore = catalogItems.filter((item) => {
    return (
      !item.slug ||
      !item.edition.id ||
      item.edition.priceVnd <= 0 ||
      item.edition.stockQuantity < 0 ||
      !item.coverAsset?.path?.startsWith("/images/books/v12-covers/")
    );
  });
  const coverResponses = [];

  for (const item of catalogItems) {
    const coverPath = item.coverAsset?.path;

    if (!coverPath) {
      coverResponses.push({
        contentType: null,
        ok: false,
        path: null,
        status: 0,
      });
      continue;
    }

    const response = await fetchWithTimeout(new URL(coverPath, baseURL));

    coverResponses.push({
      contentType: response.headers.get("content-type"),
      ok: response.ok,
      path: coverPath,
      status: response.status,
    });
  }

  const brokenCovers = coverResponses.filter((cover) => {
    return !cover.ok || !(cover.contentType ?? "").includes("image/svg");
  });
  const pass = {
    apiOk: catalog.status === 200 && catalog.payload.error === null,
    bilingualCopy: missingBilingualCopy.length === 0,
    coverResponses: brokenCovers.length === 0,
    languageParity: languageCounts.en === 50 && languageCounts.vi === 50,
    noPlaceholderPrimaryCovers: placeholderCovers.length === 0,
    noPublicFieldLeaks: publicFieldLeaks.length === 0,
    validCoreFields: invalidCore.length === 0,
    volume: catalog.payload.meta?.total === 100 && catalogItems.length === 100,
  };

  return {
    failures: {
      brokenCoverCount: brokenCovers.length,
      invalidCoreCount: invalidCore.length,
      missingBilingualCopyCount: missingBilingualCopy.length,
      placeholderCoverCount: placeholderCovers.length,
      publicFieldLeakCount: publicFieldLeaks.length,
    },
    pass,
    summary: {
      activeEditionCount: catalogItems.length,
      coverCount: coverResponses.length,
      languageCounts,
      metaTotal: catalog.payload.meta?.total,
    },
  };
}

async function inspectBrowser(
  baseURL: string,
  englishTarget: CatalogItem,
  vietnameseTarget: CatalogItem,
) {
  const browser = await chromium.launch();
  const screenshots: Record<string, string> = {};

  try {
    const desktopEn = await newPage(browser, baseURL, "en", {
      height: 900,
      width: 1440,
    });
    await desktopEn.goto("/", { waitUntil: "domcontentloaded" });
    await desktopEn.waitForSelector("main", { state: "visible" });
    await desktopEn.screenshot({
      fullPage: true,
      path: screenshotPath("production-home-desktop-en.png", screenshots, "homeDesktopEn"),
    });

    const cartEntry = await verifyCartEntry(desktopEn, englishTarget.edition.id);
    const assistant = await verifyAssistant(desktopEn);
    const homeNoOverflow = await hasNoHorizontalOverflow(desktopEn);

    const catalogVi = await newPage(browser, baseURL, "vi", {
      height: 844,
      width: 390,
    });
    await catalogVi.goto("/catalog", { waitUntil: "domcontentloaded" });
    await catalogVi.waitForSelector("[data-catalog-page]", {
      state: "visible",
    });
    const catalogText = await visibleText(catalogVi, "[data-catalog-page]");
    const languageMode =
      /Danh mục|Sách|Tiếng Việt|Bìa/i.test(catalogText) &&
      !(await hasHorizontalOverflow(catalogVi));
    await catalogVi.screenshot({
      fullPage: true,
      path: screenshotPath("production-catalog-mobile-vi.png", screenshots, "catalogMobileVi"),
    });

    const detailEn = await newPage(browser, baseURL, "en", {
      height: 900,
      width: 1440,
    });
    await detailEn.goto(`/products/${englishTarget.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await detailEn.waitForSelector("[data-book-detail]", { state: "visible" });
    const enDetailText = await visibleText(detailEn, "[data-book-detail]");
    const enDetailImage = await detailEn.locator("[data-book-detail-image] img").isVisible();
    const enDetailNoOverflow = await hasNoHorizontalOverflow(detailEn);
    await detailEn.screenshot({
      fullPage: true,
      path: screenshotPath("production-detail-desktop-en.png", screenshots, "detailDesktopEn"),
    });

    const detailVi = await newPage(browser, baseURL, "vi", {
      height: 844,
      width: 390,
    });
    await detailVi.goto(`/products/${vietnameseTarget.slug}`, {
      waitUntil: "domcontentloaded",
    });
    await detailVi.waitForSelector("[data-book-detail]", { state: "visible" });
    const viDetailText = await visibleText(detailVi, "[data-book-detail]");
    const viDetailImage = await detailVi.locator("[data-book-detail-image] img").isVisible();
    const viDetailNoOverflow = await hasNoHorizontalOverflow(detailVi);
    await detailVi.screenshot({
      fullPage: true,
      path: screenshotPath("production-detail-mobile-vi.png", screenshots, "detailMobileVi"),
    });

    const checkoutPage = await newPage(browser, baseURL, "en", {
      height: 844,
      width: 390,
    });
    await seedCart(checkoutPage, englishTarget.edition.id);
    await checkoutPage.goto("/checkout", { waitUntil: "domcontentloaded" });
    const checkoutBoundary = /\/account\?next=%2Fcheckout|\/account\?next=\/checkout/.test(
      checkoutPage.url(),
    );

    const adminPage = await newPage(browser, baseURL, "en", {
      height: 844,
      width: 390,
    });
    await adminPage.goto("/admin/orders", { waitUntil: "domcontentloaded" });
    await adminPage.waitForSelector("[data-admin-login-page]", {
      state: "visible",
    });
    const adminBoundary = /\/admin\/login\?reason=unauthorized/.test(adminPage.url());
    await adminPage.screenshot({
      fullPage: true,
      path: screenshotPath("production-admin-boundary-mobile-en.png", screenshots, "adminBoundaryMobileEn"),
    });

    await Promise.all([
      desktopEn.close(),
      catalogVi.close(),
      detailEn.close(),
      detailVi.close(),
      checkoutPage.close(),
      adminPage.close(),
    ]);

    return {
      pass: {
        adminBoundary,
        assistant,
        cartEntry,
        checkoutBoundary,
        detailPages:
          enDetailImage &&
          viDetailImage &&
          enDetailText.includes(englishTarget.edition.displayTitle) &&
          viDetailText.includes(vietnameseTarget.edition.displayTitle) &&
          enDetailNoOverflow &&
          viDetailNoOverflow,
        languageMode,
        noHomeOverflow: homeNoOverflow,
      },
      screenshots,
    };
  } finally {
    await browser.close();
  }
}

async function verifyCartEntry(page: Page, editionId: string) {
  await seedCart(page, editionId);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => {
      return (
        document.querySelector("[data-cart-count]")?.getAttribute("data-cart-count") ===
        "1"
      );
    },
    undefined,
    { timeout: 20_000 },
  );
  await domClick(page, "[data-cart-drawer-open]");
  await page.waitForSelector("[data-cart-drawer]", { state: "visible" });
  await page.waitForSelector("[data-cart-drawer-item]", {
    state: "visible",
    timeout: 20_000,
  });
  return (await page.locator("[data-cart-drawer-item]").count()) > 0;
}

async function verifyAssistant(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await domClick(page, "[data-book-assistant-toggle]");
  await page.waitForSelector("[data-book-assistant-panel]", { state: "visible" });
  await page.locator("[data-book-assistant-input]").fill("gatsby english");
  await domClick(page, "[data-book-assistant-send]");
  await page
    .locator("[data-book-assistant-loading]")
    .waitFor({ state: "detached", timeout: 20_000 })
    .catch(() => undefined);
  await page.waitForSelector("[data-book-assistant-result]", {
    state: "visible",
    timeout: 20_000,
  });
  const href = await page
    .locator("[data-book-assistant-result-link]")
    .first()
    .getAttribute("href");

  return typeof href === "string" && href.startsWith("/products/");
}

async function newPage(
  browser: Browser,
  baseURL: string,
  language: "en" | "vi",
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL,
    isMobile: viewport.width < 600,
    viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: baseURL,
      value: language,
    },
  ]);

  return context.newPage();
}

async function seedCart(page: Page, editionId: string) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ key, productId }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          items: [{ productId, quantity: 1 }],
          version: 1,
        }),
      );
    },
    { key: CART_STORAGE_KEY, productId: editionId },
  );
}

async function visibleText(page: Page, selector: string) {
  return page.locator(selector).filter({ visible: true }).first().innerText();
}

async function domClick(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: "visible" });
  await page.evaluate((targetSelector) => {
    const element = document.querySelector<HTMLElement>(targetSelector);
    if (!element) {
      throw new Error(`Missing element: ${targetSelector}`);
    }
    element.click();
  }, selector);
}

async function hasNoHorizontalOverflow(page: Page) {
  return !(await hasHorizontalOverflow(page));
}

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  });
}

function screenshotPath(
  filename: string,
  screenshots: Record<string, string>,
  key: string,
) {
  const targetPath = path.join(ARTIFACT_DIR, filename);
  screenshots[key] = targetPath;
  return targetPath;
}

function isPublicHtmlSafe(body: string) {
  return !/sourceEditionKey|sourceReviewStatus|reviewerNote|rightsAnalysis|TBC/i.test(
    body,
  );
}

async function fetchText(url: URL): Promise<HttpCheck> {
  const response = await fetchWithTimeout(url);

  return {
    body: await response.text(),
    status: response.status,
  };
}

async function fetchJson<TData>(url: URL): Promise<JsonCheck<TData>> {
  const response = await fetchWithTimeout(url);

  return {
    payload: (await response.json()) as ApiResponse<TData>,
    status: response.status,
  };
}

async function fetchWithTimeout(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Base URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
