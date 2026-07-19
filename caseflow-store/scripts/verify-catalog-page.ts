import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d28-t01");
const EXPECTED_TOTAL_EDITIONS = 500;
const EXPECTED_INITIAL_RENDERED_CARDS = 24;
const EXPECTED_TOTAL_PAGES = 21;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.CATALOG_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const desktop = await inspectCatalog(browser, baseURL, {
      language: "en",
      path: "/catalog",
      screenshotName: "catalog-desktop-en.png",
      viewport: { height: 1100, width: 1440 },
    });
    const mobile = await inspectCatalog(browser, baseURL, {
      language: "vi",
      path: "/catalog?page=2",
      screenshotName: "catalog-mobile-vi-page-2.png",
      viewport: { height: 900, width: 375 },
    });
    const pagination = await inspectPagination(browser, baseURL);
    const pass = {
      activeViewVisible:
        desktop.activeFilterCount >= 5 && mobile.activeFilterCount >= 5,
      cardMetadataVisible:
        desktop.firstCard.hasAuthor &&
        desktop.firstCard.hasDetailLink &&
        desktop.firstCard.hasFormat &&
        desktop.firstCard.hasImage &&
        desktop.firstCard.hasLanguage &&
        desktop.firstCard.hasPrice &&
        desktop.firstCard.hasSaleState &&
        desktop.firstCard.hasStock,
      desktopNoOverflow: !desktop.hasHorizontalOverflow,
      initialPageDoesNotRenderAllEditions:
        desktop.renderedCards === EXPECTED_INITIAL_RENDERED_CARDS &&
        desktop.renderedCards < desktop.totalEditions,
      mobileNoOverflow: !mobile.hasHorizontalOverflow,
      pageTwoRendersExpectedCards:
        mobile.renderedCards === EXPECTED_INITIAL_RENDERED_CARDS,
      paginationWorks:
        pagination.pageTwoUrl.endsWith("/catalog?page=2") &&
        pagination.pageTwoCurrent === "2" &&
        pagination.pageTwoRenderedCards === EXPECTED_INITIAL_RENDERED_CARDS,
      resultCountsVisible:
        desktop.resultCountText.includes("1-24") &&
        desktop.resultCountText.includes("500") &&
        mobile.resultCountText.includes("25-48") &&
        mobile.resultCountText.includes("500"),
      totalCatalogCount:
        desktop.totalEditions === EXPECTED_TOTAL_EDITIONS &&
        mobile.totalEditions === EXPECTED_TOTAL_EDITIONS,
      totalPagesVisible:
        desktop.paginationLinks === EXPECTED_TOTAL_PAGES &&
        mobile.paginationLinks === EXPECTED_TOTAL_PAGES,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      desktop,
      expected: {
        initialRenderedCards: EXPECTED_INITIAL_RENDERED_CARDS,
        totalEditions: EXPECTED_TOTAL_EDITIONS,
        totalPages: EXPECTED_TOTAL_PAGES,
      },
      mobile,
      ok,
      pagination,
      pass,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "catalog-page-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          desktop: {
            renderedCards: desktop.renderedCards,
            resultCountText: desktop.resultCountText,
            totalEditions: desktop.totalEditions,
          },
          mobile: {
            renderedCards: mobile.renderedCards,
            resultCountText: mobile.resultCountText,
            totalEditions: mobile.totalEditions,
          },
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

async function inspectCatalog(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    path: string;
    screenshotName: string;
    viewport: { height: number; width: number };
  },
) {
  const context = await browser.newContext({
    baseURL,
    viewport: options.viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: baseURL,
      value: options.language,
    },
  ]);
  const page = await context.newPage();

  await page.goto(options.path, { waitUntil: "domcontentloaded" });
  const catalogPage = page.locator("[data-catalog-page]").first();
  await catalogPage.waitFor();

  const totalEditions = Number(
    await catalogPage.getAttribute("data-catalog-total-count"),
  );
  const renderedCards = await catalogPage.locator("[data-catalog-card]").count();
  const activeFilterCount = await catalogPage
    .locator("[data-catalog-active-filters] span")
    .count();
  const resultCountText = await catalogPage
    .locator("[data-catalog-result-count]")
    .innerText();
  const firstCard = await readFirstCard(page);
  const hasHorizontalOverflow = await hasOverflow(page);
  const paginationLinks = await catalogPage
    .locator("[data-catalog-page-link]")
    .count();

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, options.screenshotName),
  });
  await context.close();

  return {
    activeFilterCount,
    firstCard,
    hasHorizontalOverflow,
    paginationLinks,
    renderedCards,
    resultCountText,
    totalEditions,
    viewport: options.viewport,
  };
}

async function inspectPagination(browser: Browser, baseURL: string) {
  const context = await browser.newContext({
    baseURL,
    viewport: { height: 960, width: 1280 },
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: baseURL,
      value: "en",
    },
  ]);
  const page = await context.newPage();

  await page.goto("/catalog", { waitUntil: "domcontentloaded" });
  await page.locator("[data-catalog-page-link='2']").click();
  await page.waitForURL("**/catalog?page=2");

  const pageTwoCurrent =
    (await page.locator("[data-catalog-page-link][aria-current='page']").innerText()).trim();
  const pageTwoRenderedCards = await page.locator("[data-catalog-card]").count();
  const pageTwoUrl = page.url();
  await context.close();

  return {
    pageTwoCurrent,
    pageTwoRenderedCards,
    pageTwoUrl,
  };
}

async function readFirstCard(page: Page) {
  const firstCard = page.locator("[data-catalog-card]").first();
  const text = await firstCard.innerText();

  return {
    hasAuthor: /Charles|Aesop|Austen|Twain|Dickens|Shelley/i.test(text),
    hasDetailLink: await firstCard.getByText(/View details|Xem chi tiết/).isVisible(),
    hasFormat: /Paperback|Hardcover|Special edition|Bìa mềm|Bìa cứng|Ấn bản đặc biệt/.test(
      text,
    ),
    hasImage: await firstCard.locator("img").isVisible(),
    hasLanguage: /English|Vietnamese|Tiếng Anh|Tiếng Việt/.test(text),
    hasPrice: /₫/.test(text),
    hasSaleState: /Editorial shelf|Standard listing|CaseFlow offer|Kệ biên tập|Niêm yết thường|Ưu đãi theo giá CaseFlow/.test(
      text,
    ),
    hasStock: /In stock|Low stock|Còn hàng|Sắp hết/.test(text),
  };
}

async function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("CATALOG_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
