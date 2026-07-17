import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d28-t02");
const COMBINED_FILTERS = {
  availability: "available",
  category: "classic-literature",
  featured: "true",
  format: "paperback",
  language: "en",
  q: "Dickens",
  sort: "price-asc",
} as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.CATALOG_FILTER_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const combined = await inspectCombinedFilters(browser, baseURL);
    const authorSort = await inspectAuthorSort(browser, baseURL);
    const invalid = await inspectInvalidParams(browser, baseURL);
    const pass = {
      apiAndUiCountsAgree:
        combined.uiResultTotal === combined.apiMeta.total &&
        combined.uiRenderedCards === combined.apiMeta.count,
      clearFiltersWorks:
        combined.clearResultTotal === 100 && combined.clearRenderedCards === 24,
      combinedFiltersApplied:
        combined.urlIncludes.every(Boolean) &&
        combined.activeChipText.includes("Classic literature") &&
        combined.activeChipText.includes("English") &&
        combined.activeChipText.includes("Paperback") &&
        combined.activeChipText.includes("Featured shelf"),
      invalidParamsDoNotCrash:
        invalid.headingVisible &&
        invalid.renderedCards === 24 &&
        invalid.resultTotal === 100,
      noOverflow:
        !combined.hasHorizontalOverflow &&
        !authorSort.hasHorizontalOverflow &&
        !invalid.hasHorizontalOverflow,
      priceSortAscending: combined.pricesAscending,
      sortAuthorAscending: authorSort.authorsAscending,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      authorSort,
      baseURL,
      combined,
      invalid,
      ok,
      pass,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "catalog-filters-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          combined: {
            apiTotal: combined.apiMeta.total,
            renderedCards: combined.uiRenderedCards,
            uiTotal: combined.uiResultTotal,
          },
          invalid: {
            renderedCards: invalid.renderedCards,
            resultTotal: invalid.resultTotal,
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

async function inspectCombinedFilters(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto("/catalog", { waitUntil: "domcontentloaded" });
  const form = page.locator("[data-catalog-filter-form]");
  await form.locator("input[name='q']").fill(COMBINED_FILTERS.q);
  await form.locator("select[name='category']").selectOption(COMBINED_FILTERS.category);
  await form.locator("select[name='language']").selectOption(COMBINED_FILTERS.language);
  await form.locator("select[name='format']").selectOption(COMBINED_FILTERS.format);
  await form
    .locator("select[name='availability']")
    .selectOption(COMBINED_FILTERS.availability);
  await form.locator("select[name='featured']").selectOption(COMBINED_FILTERS.featured);
  await form.locator("select[name='sort']").selectOption(COMBINED_FILTERS.sort);
  await form.getByRole("button", { name: "Apply filters" }).click();
  await page.waitForURL((url) => url.pathname === "/catalog" && url.search.length > 0);
  await page.locator("[data-catalog-card]").first().waitFor();

  const uiResultTotal = await readNumberAttribute(
    page,
    "[data-catalog-page]",
    "data-catalog-result-total",
  );
  const uiRenderedCards = await page.locator("[data-catalog-card]").count();
  const apiMeta = await readApiMeta(baseURL, {
    ...COMBINED_FILTERS,
    limit: "24",
    offset: "0",
  });
  const activeChipText = await page
    .locator("[data-catalog-active-filters]")
    .innerText();
  const priceValues = await readNumberAttributes(
    page,
    "[data-catalog-price-vnd]",
    "data-catalog-price-vnd",
  );
  const pricesAscending = isAscending(priceValues);
  const url = new URL(page.url());
  const urlIncludes = [
    url.searchParams.get("q") === COMBINED_FILTERS.q,
    url.searchParams.get("category") === COMBINED_FILTERS.category,
    url.searchParams.get("language") === COMBINED_FILTERS.language,
    url.searchParams.get("format") === COMBINED_FILTERS.format,
    url.searchParams.get("availability") === COMBINED_FILTERS.availability,
    url.searchParams.get("featured") === COMBINED_FILTERS.featured,
    url.searchParams.get("sort") === COMBINED_FILTERS.sort,
  ];
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "catalog-filters-desktop-en.png"),
  });

  await page.locator("[data-catalog-clear-filters]").click();
  await page.waitForURL("**/catalog");
  const clearResultTotal = await readNumberAttribute(
    page,
    "[data-catalog-page]",
    "data-catalog-result-total",
  );
  const clearRenderedCards = await page.locator("[data-catalog-card]").count();
  await context.close();

  return {
    activeChipText,
    apiMeta,
    clearRenderedCards,
    clearResultTotal,
    hasHorizontalOverflow,
    pricesAscending,
    uiRenderedCards,
    uiResultTotal,
    urlIncludes,
  };
}

async function inspectAuthorSort(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 960,
    width: 1280,
  });
  const page = await context.newPage();

  await page.goto("/catalog?sort=author-asc", { waitUntil: "domcontentloaded" });
  await page.locator("[data-catalog-card]").first().waitFor();
  const authors = await page
    .locator("[data-catalog-author]")
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-catalog-author") ?? ""),
    );
  const hasHorizontalOverflow = await hasOverflow(page);
  await context.close();

  return {
    authors,
    authorsAscending: isAscending(authors),
    hasHorizontalOverflow,
  };
}

async function inspectInvalidParams(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "vi", {
    height: 900,
    width: 375,
  });
  const page = await context.newPage();

  await page.goto(
    "/catalog?category=not-real&language=fr&format=audio&sort=wat&page=-5&minPriceVnd=999999999&maxPriceVnd=-1",
    { waitUntil: "domcontentloaded" },
  );
  await page.locator("[data-catalog-page]").waitFor();
  const headingVisible = await page
    .getByRole("heading", { name: "Tất cả ấn bản sách" })
    .isVisible();
  const renderedCards = await page.locator("[data-catalog-card]").count();
  const resultTotal = await readNumberAttribute(
    page,
    "[data-catalog-page]",
    "data-catalog-result-total",
  );
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "catalog-invalid-mobile-vi.png"),
  });
  await context.close();

  return {
    hasHorizontalOverflow,
    headingVisible,
    renderedCards,
    resultTotal,
  };
}

async function readApiMeta(
  baseURL: string,
  params: Record<string, string>,
) {
  const url = new URL("/api/products", baseURL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API count check failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    meta: { count: number; total: number };
  };

  return payload.meta;
}

async function newLanguageContext(
  browser: Browser,
  baseURL: string,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL,
    viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: baseURL,
      value: language,
    },
  ]);

  return context;
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
  const values = await page
    .locator(selector)
    .evaluateAll((nodes, attr) =>
      nodes.map((node) => Number(node.getAttribute(attr as string))),
    attribute);

  return values;
}

async function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

function isAscending(values: Array<number | string>) {
  return values.every((value, index) => {
    if (index === 0) {
      return true;
    }

    return value >= values[index - 1];
  });
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("CATALOG_FILTER_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
