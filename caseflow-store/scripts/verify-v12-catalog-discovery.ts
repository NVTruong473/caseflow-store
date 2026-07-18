import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const TASK_ID = "V12-T13";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t13");
const REPORT_PATH = path.join(ARTIFACT_DIR, "catalog-discovery-check.json");
const BASE_URL =
  process.env.CATALOG_V12_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://localhost:3000";
const EXPECTED_TOTAL_EDITIONS = 100;
const EXPECTED_RENDERED_CARDS = 24;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    const desktop = await inspectDefaultCatalog(browser);
    const mobile = await inspectMobileCatalog(browser);
    const filters = await inspectCombinedFilters(browser);
    const longTitle = await inspectLongTitleSearch(browser);
    const availability = await inspectAvailabilityStates(browser);
    const pass = {
      defaultDiscovery:
        desktop.totalEditions === EXPECTED_TOTAL_EDITIONS &&
        desktop.renderedCards === EXPECTED_RENDERED_CARDS &&
        desktop.offerCards > 0 &&
        desktop.standardCards > 0 &&
        desktop.pairedCards > 0 &&
        desktop.editorialCards > 0 &&
        desktop.imagesLoaded &&
        desktop.noUnsupportedText &&
        !desktop.hasHorizontalOverflow,
      mobileCardsCompact:
        mobile.renderedCards === EXPECTED_RENDERED_CARDS &&
        mobile.firstCardImageWidth <= 112 &&
        mobile.firstCardHeight <= 340 &&
        !mobile.hasHorizontalOverflow,
      filtersAndUrlState:
        filters.urlStatePreserved &&
        filters.activeChipsUpdated &&
        filters.resultSignalsUpdated &&
        filters.pricesAscending &&
        filters.renderedCards === filters.resultTotal &&
        !filters.hasHorizontalOverflow,
      longTitleSafe:
        longTitle.renderedCards > 0 &&
        longTitle.maxCardOverflowPx <= 1 &&
        longTitle.noUnsupportedText &&
        !longTitle.hasHorizontalOverflow,
      availabilityStates:
        availability.lowStockCount > 0 &&
        availability.lowStockCardsAllLowStock &&
        availability.outOfStockEmptyVisible &&
        availability.outOfStockTotal === 0 &&
        !availability.lowStockOverflow &&
        !availability.outOfStockOverflow,
    };
    const report = {
      taskId: TASK_ID,
      generatedAt: new Date().toISOString(),
      baseURL: BASE_URL,
      availability,
      desktop,
      filters,
      longTitle,
      mobile,
      ok: Object.values(pass).every(Boolean),
      pass,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: report.ok,
          artifact: REPORT_PATH,
          pass: report.pass,
          screenshots: [
            desktop.screenshotPath,
            mobile.screenshotPath,
            filters.screenshotPath,
            longTitle.screenshotPath,
          ],
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

async function inspectDefaultCatalog(browser: Browser) {
  const context = await newLanguageContext(browser, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto("/catalog", { waitUntil: "domcontentloaded" });
  await waitForCatalog(page);
  await warmLazyImages(page);
  const screenshotPath = path.join(ARTIFACT_DIR, "catalog-desktop-en.png");
  await page.screenshot({ fullPage: true, path: screenshotPath });

  const resultSignalsText = await page
    .locator("[data-catalog-result-signals]")
    .innerText();
  const cardSources = await page
    .locator("[data-catalog-card]")
    .evaluateAll((cards) =>
      cards.map((card) => ({
        coverSource: card.getAttribute("data-catalog-cover-source") ?? "",
        title: card.getAttribute("data-catalog-card-title") ?? "",
      })),
    );
  const imageNaturalSizes = await page.locator("[data-catalog-card] img").evaluateAll(
    (images) =>
      images.map((image) => {
        const htmlImage = image as HTMLImageElement;
        return {
          naturalHeight: htmlImage.naturalHeight,
          naturalWidth: htmlImage.naturalWidth,
          src: htmlImage.currentSrc || htmlImage.src,
        };
      }),
  );
  const text = await page.locator("[data-catalog-page]").innerText();
  const result = {
    activeChipText: await page.locator("[data-catalog-active-filters]").innerText(),
    editorialCards: await page.locator("[data-catalog-editorial='true']").count(),
    hasHorizontalOverflow: await hasOverflow(page),
    imagesLoaded:
      imageNaturalSizes.length === EXPECTED_RENDERED_CARDS &&
      imageNaturalSizes.every(
        (image) =>
          image.naturalWidth > 0 &&
          image.naturalHeight > 0 &&
          !image.src.includes("book-cover-placeholder"),
      ) &&
      cardSources.every(
        (card) => card.coverSource !== "missing" && card.coverSource !== "placeholder",
      ),
    noUnsupportedText: noUnsupportedCatalogText(text),
    offerCards: await page.locator("[data-catalog-promotion='compare-at']").count(),
    pairedCards: await page.locator("[data-catalog-paired='true']").count(),
    renderedCards: await page.locator("[data-catalog-card]").count(),
    resultSignalsText,
    screenshotPath,
    standardCards: await page.locator("[data-catalog-promotion='none']").count(),
    totalEditions: await readNumberAttribute(
      page,
      "[data-catalog-page]",
      "data-catalog-total-count",
    ),
  };

  await context.close();
  return result;
}

async function inspectMobileCatalog(browser: Browser) {
  const context = await newLanguageContext(browser, "vi", {
    height: 900,
    width: 375,
  });
  const page = await context.newPage();

  await page.goto("/catalog?page=2", { waitUntil: "domcontentloaded" });
  await waitForCatalog(page);
  await warmLazyImages(page);
  const screenshotPath = path.join(ARTIFACT_DIR, "catalog-mobile-vi-page-2.png");
  await page.screenshot({ fullPage: true, path: screenshotPath });

  const firstCardBox = await page.locator("[data-catalog-card]").first().boundingBox();
  const firstImageBox = await page
    .locator("[data-catalog-card] img")
    .first()
    .boundingBox();
  const result = {
    firstCardHeight: firstCardBox?.height ?? 0,
    firstCardImageWidth: firstImageBox?.width ?? Number.POSITIVE_INFINITY,
    hasHorizontalOverflow: await hasOverflow(page),
    renderedCards: await page.locator("[data-catalog-card]").count(),
    screenshotPath,
  };

  await context.close();
  return result;
}

async function inspectCombinedFilters(browser: Browser) {
  const context = await newLanguageContext(browser, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();
  const pathName =
    "/catalog?q=Dickens&category=classic-literature&language=en&format=paperback&availability=available&featured=true&sort=price-asc";

  await page.goto(pathName, { waitUntil: "domcontentloaded" });
  await waitForCatalog(page);
  await warmLazyImages(page);
  const screenshotPath = path.join(ARTIFACT_DIR, "catalog-filtered-desktop-en.png");
  await page.screenshot({ fullPage: true, path: screenshotPath });

  const url = new URL(page.url());
  const activeChipText = await page
    .locator("[data-catalog-active-filters]")
    .innerText();
  const resultSignalsText = await page
    .locator("[data-catalog-result-signals]")
    .innerText();
  const prices = await readNumberAttributes(
    page,
    "[data-catalog-price-vnd]",
    "data-catalog-price-vnd",
  );

  const result = {
    activeChipsUpdated:
      activeChipText.includes("Classic literature") &&
      activeChipText.includes("English") &&
      activeChipText.includes("Paperback") &&
      activeChipText.includes("Editor picks only"),
    hasHorizontalOverflow: await hasOverflow(page),
    pricesAscending: isAscending(prices),
    renderedCards: await page.locator("[data-catalog-card]").count(),
    resultSignalsText,
    resultSignalsUpdated:
      resultSignalsText.includes("Sort: Price low-high") &&
      resultSignalsText.includes("Availability: Available") &&
      resultSignalsText.includes("Editorial labels are shelf-based"),
    resultTotal: await readNumberAttribute(
      page,
      "[data-catalog-page]",
      "data-catalog-result-total",
    ),
    screenshotPath,
    urlStatePreserved:
      url.searchParams.get("q") === "Dickens" &&
      url.searchParams.get("category") === "classic-literature" &&
      url.searchParams.get("language") === "en" &&
      url.searchParams.get("format") === "paperback" &&
      url.searchParams.get("availability") === "available" &&
      url.searchParams.get("featured") === "true" &&
      url.searchParams.get("sort") === "price-asc",
  };

  await context.close();
  return result;
}

async function inspectLongTitleSearch(browser: Browser) {
  const context = await newLanguageContext(browser, "en", {
    height: 900,
    width: 375,
  });
  const page = await context.newPage();

  await page.goto("/catalog?q=Strange&sort=relevance", {
    waitUntil: "domcontentloaded",
  });
  await waitForCatalog(page);
  await warmLazyImages(page);
  const screenshotPath = path.join(ARTIFACT_DIR, "catalog-long-title-mobile-en.png");
  await page.screenshot({ fullPage: true, path: screenshotPath });

  const text = await page.locator("[data-catalog-page]").innerText();
  const result = {
    hasHorizontalOverflow: await hasOverflow(page),
    maxCardOverflowPx: await readMaxCardOverflowPx(page),
    noUnsupportedText: noUnsupportedCatalogText(text),
    renderedCards: await page.locator("[data-catalog-card]").count(),
    screenshotPath,
  };

  await context.close();
  return result;
}

async function inspectAvailabilityStates(browser: Browser) {
  const lowStockContext = await newLanguageContext(browser, "en", {
    height: 900,
    width: 1280,
  });
  const lowStockPage = await lowStockContext.newPage();
  await lowStockPage.goto("/catalog?availability=low-stock", {
    waitUntil: "domcontentloaded",
  });
  await waitForCatalog(lowStockPage);
  const lowStockStatuses = await lowStockPage
    .locator("[data-catalog-card]")
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-catalog-inventory-status")),
    );
  const lowStockOverflow = await hasOverflow(lowStockPage);
  await lowStockContext.close();

  const outOfStockContext = await newLanguageContext(browser, "vi", {
    height: 812,
    width: 375,
  });
  const outOfStockPage = await outOfStockContext.newPage();
  await outOfStockPage.goto("/catalog?availability=out-of-stock", {
    waitUntil: "domcontentloaded",
  });
  await outOfStockPage.locator("[data-catalog-page]").waitFor();
  const outOfStockEmptyVisible = await outOfStockPage
    .locator("[data-book-catalog-empty-state]")
    .isVisible();
  const outOfStockTotal = await readNumberAttribute(
    outOfStockPage,
    "[data-catalog-page]",
    "data-catalog-result-total",
  );
  const outOfStockOverflow = await hasOverflow(outOfStockPage);
  await outOfStockContext.close();

  return {
    lowStockCardsAllLowStock:
      lowStockStatuses.length > 0 &&
      lowStockStatuses.every((status) => status === "low-stock"),
    lowStockCount: lowStockStatuses.length,
    lowStockOverflow,
    outOfStockEmptyVisible,
    outOfStockOverflow,
    outOfStockTotal,
  };
}

async function waitForCatalog(page: Page) {
  await page.locator("[data-catalog-page]").waitFor();
  await page.locator("[data-catalog-result-signals]").waitFor();
}

async function newLanguageContext(
  browser: Browser,
  language: Language,
  viewport: { height: number; width: number },
): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: language,
    },
  ]);

  return context;
}

async function warmLazyImages(page: Page) {
  await page.evaluate(`
    (async () => {
      const delay = (durationMs) =>
        new Promise((resolve) => window.setTimeout(resolve, durationMs));
      const waitForImage = (image) =>
        new Promise((resolve) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }

          const timeout = window.setTimeout(resolve, 2500);
          const finish = () => {
            window.clearTimeout(timeout);
            resolve();
          };

          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
        });
      const images = Array.from(
        document.querySelectorAll("[data-catalog-card] img"),
      );

      for (const image of images) {
        image.loading = "eager";
        image.scrollIntoView({ block: "center", inline: "nearest" });
        await waitForImage(image);
        if (typeof image.decode === "function") {
          await image.decode().catch(() => undefined);
        }
        await delay(60);
      }

      window.scrollTo(0, 0);
      await delay(250);
    })()
  `);
}

async function readNumberAttribute(
  page: Page,
  selector: string,
  attribute: string,
) {
  return Number(await page.locator(selector).getAttribute(attribute));
}

async function readNumberAttributes(
  page: Page,
  selector: string,
  attribute: string,
) {
  return page.locator(selector).evaluateAll((elements, attr) => {
    return elements.map((element) =>
      Number(element.getAttribute(attr as string)),
    );
  }, attribute);
}

async function readMaxCardOverflowPx(page: Page) {
  return page.locator("[data-catalog-card]").evaluateAll((cards) => {
    return cards.reduce((maxOverflow, card) => {
      return Math.max(maxOverflow, card.scrollWidth - card.clientWidth);
    }, 0);
  });
}

async function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

function noUnsupportedCatalogText(text: string) {
  return !/(TBC|undefined|null|placeholder|seed|debug)/i.test(text);
}

function isAscending(values: Array<number | string>) {
  return values.every((value, index, list) => {
    if (index === 0) return true;
    return list[index - 1] <= value;
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
