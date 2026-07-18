import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t14");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const UNSUPPORTED_PUBLIC_COPY =
  /\b(?:\d+(?:\.\d)?\/5|sold|đã bán|bestseller|best seller|xếp hạng|same-day|giao trong 2h|giao hôm nay)\b/i;
const PLACEHOLDER_COPY = /TBC|Đang cập nhật|Not specified|Chưa xác định|null|undefined/i;

type ApiResponse<TData, TMeta = Record<string, unknown>> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: TMeta | null;
};

type LocalizedText = {
  en: string;
  vi: string;
};

type DisplayFact = {
  key: string;
  label: LocalizedText;
  value: LocalizedText;
  provenanceRecordId: string;
};

type BookCatalogItem = {
  id: string;
  slug: string;
  title: string;
  edition: {
    id: string;
    slug: string;
    displayTitle: string;
    localizedDisplayTitle: Partial<LocalizedText>;
    language: Language;
    format: string;
    priceVnd: number;
    compareAtPriceVnd: number | null;
    stockQuantity: number;
    inventoryStatus: string;
    reasonToRead: LocalizedText | null;
    displayFacts: DisplayFact[];
    omittedOptionalFactKeys: string[];
    pairedEditionId: string | null;
  };
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.V12_BOOK_DETAIL_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const catalog = await fetchCatalog(baseURL);
  const target = findPairedOfferTarget(catalog);
  const pairedTarget = required(
    catalog.find((item) => item.edition.id === target.edition.pairedEditionId),
    "Paired edition target was not present in API catalog",
  );
  const missingFactsTarget = required(
    catalog.find((item) => item.edition.displayFacts.length === 0),
    "No active edition with omitted optional facts was available for detail check",
  );
  const browser = await chromium.launch();

  try {
    const desktop = await inspectDetail(browser, baseURL, {
      language: "en",
      screenshotName: "detail-desktop-en.png",
      target,
      viewport: { height: 1100, width: 1440 },
    });
    const mobile = await inspectDetail(browser, baseURL, {
      language: "vi",
      screenshotName: "detail-mobile-vi.png",
      target: pairedTarget,
      viewport: { height: 1100, width: 375 },
    });
    const missingFacts = await inspectMissingFacts(browser, baseURL, {
      screenshotName: "detail-missing-facts-mobile-vi.png",
      target: missingFactsTarget,
    });
    const pass = {
      addToCartTargetsCurrentEdition:
        desktop.cartStorageContainsCurrentEdition &&
        mobile.cartStorageContainsCurrentEdition,
      bilingualScreenshotsSaved:
        desktop.screenshotSaved && mobile.screenshotSaved,
      editionComparison:
        desktop.editionOptions >= 2 &&
        mobile.editionOptions >= 2 &&
        desktop.hasCurrentEditionMarker &&
        mobile.hasCurrentEditionMarker &&
        desktop.pairedEditionLinksValid &&
        mobile.pairedEditionLinksValid,
      firstScreenHierarchy:
        desktop.firstScreen.cover &&
        desktop.firstScreen.title &&
        desktop.firstScreen.price &&
        desktop.firstScreen.addToCart &&
        desktop.firstScreen.editionComparison &&
        mobile.firstScreen.cover &&
        mobile.firstScreen.title &&
        mobile.firstScreen.price &&
        mobile.firstScreen.addToCart,
      missingFactsOmitted:
        missingFacts.visibleFactTerms === 0 &&
        !missingFacts.hasPlaceholderCopy &&
        missingFacts.hasVerifiedFactsSection,
      noOverflow:
        !desktop.hasHorizontalOverflow &&
        !mobile.hasHorizontalOverflow &&
        !missingFacts.hasHorizontalOverflow,
      noUnsupportedClaims:
        !desktop.hasUnsupportedCopy &&
        !mobile.hasUnsupportedCopy &&
        !missingFacts.hasUnsupportedCopy,
      noPublicSourceReviewStatus:
        !desktop.hasPublicSourceReviewStatus &&
        !mobile.hasPublicSourceReviewStatus &&
        !missingFacts.hasPublicSourceReviewStatus,
      reasonAndConfidence:
        desktop.hasReasonToRead &&
        mobile.hasReasonToRead &&
        desktop.hasCommerceConfidence &&
        mobile.hasCommerceConfidence,
      seoStructuredData:
        desktop.structuredData.type === "Book" &&
        desktop.structuredData.priceCurrency === "VND" &&
        desktop.structuredData.offerUrlMatchesCanonical,
      sourcedFacts:
        desktop.visibleFactTerms === target.edition.displayFacts.length &&
        mobile.visibleFactTerms === pairedTarget.edition.displayFacts.length,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      baseURL,
      desktop,
      generatedAt: new Date().toISOString(),
      missingFacts,
      mobile,
      ok,
      pass,
      targets: {
        desktop: target.slug,
        missingFacts: missingFactsTarget.slug,
        mobile: pairedTarget.slug,
      },
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "book-detail-edition-comparison-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          targets: report.targets,
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

async function fetchCatalog(baseURL: string) {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("limit", "100");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Catalog API failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const catalog = payload.data ?? [];

  if (catalog.length < 100) {
    throw new Error(`Expected 100 active editions, received ${catalog.length}`);
  }

  return catalog;
}

function findPairedOfferTarget(catalog: BookCatalogItem[]) {
  return required(
    catalog.find(
      (item) =>
        item.edition.pairedEditionId &&
        item.edition.reasonToRead &&
        item.edition.displayFacts.length > 0 &&
        item.edition.compareAtPriceVnd !== null &&
        item.edition.compareAtPriceVnd > item.edition.priceVnd &&
        item.edition.stockQuantity > 0,
    ),
    "No paired, sourced, offer-backed edition was available for detail check",
  );
}

async function inspectDetail(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    screenshotName: string;
    target: BookCatalogItem;
    viewport: { height: number; width: number };
  },
) {
  const context = await newLanguageContext(
    browser,
    baseURL,
    options.language,
    options.viewport,
  );
  const page = await context.newPage();

  await page.goto(`/products/${options.target.slug}`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-book-detail]").waitFor();
  await page.locator("[data-book-add-to-cart-button]").waitFor({
    state: "visible",
  });

  const pageText = await page.locator("[data-book-detail]").innerText();
  const confidenceText = await page.locator("[data-book-confidence]").innerText();
  const canonical = await page
    .locator("link[rel='canonical']")
    .getAttribute("href");
  const structuredData = await inspectStructuredData(page, canonical);
  const pairedEditionHrefs = await page
    .locator("[data-book-edition-option-link]")
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href)),
    );
  const pairedEditionStatuses = await Promise.all(
    pairedEditionHrefs.map(async (href) => {
      const response = await page.request.get(href);

      return {
        href,
        status: response.status(),
      };
    }),
  );
  const screenshotPath = path.join(ARTIFACT_DIR, options.screenshotName);
  const firstScreen = await inspectFirstScreen(page);

  await page.screenshot({ fullPage: true, path: screenshotPath });
  await addCurrentEditionToCart(page, options.target.edition.id);

  const result = {
    cartStorageContainsCurrentEdition: await cartContainsEdition(
      page,
      options.target.edition.id,
    ),
    editionOptions: await page.locator("[data-book-edition-option]").count(),
    firstScreen,
    hasCommerceConfidence:
      /COD|MoMo|ZaloPay|VNPay|Return support|Hỗ trợ đổi trả/.test(
        confidenceText,
      ),
    hasCurrentEditionMarker:
      (await page.locator("[data-book-edition-option-current='true']").count()) ===
      1,
    hasHorizontalOverflow: await hasOverflow(page),
    hasReasonToRead:
      (await page.locator("[data-book-detail-reason]").count()) === 1,
    hasPublicSourceReviewStatus:
      (await page.locator("[data-book-source-status]").count()) > 0,
    hasUnsupportedCopy: UNSUPPORTED_PUBLIC_COPY.test(pageText),
    pairedEditionLinks: pairedEditionStatuses,
    pairedEditionLinksValid:
      pairedEditionStatuses.length > 0 &&
      pairedEditionStatuses.every((item) => item.status === 200),
    screenshotSaved: fs.existsSync(screenshotPath),
    structuredData,
    visibleFactTerms: await page
      .locator("[data-book-verified-facts] dt")
      .count(),
    viewport: options.viewport,
  };

  await context.close();

  return result;
}

async function inspectMissingFacts(
  browser: Browser,
  baseURL: string,
  options: {
    screenshotName: string;
    target: BookCatalogItem;
  },
) {
  const context = await newLanguageContext(browser, baseURL, "vi", {
    height: 1100,
    width: 375,
  });
  const page = await context.newPage();

  await page.goto(`/products/${options.target.slug}`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-book-detail]").waitFor();

  const pageText = await page.locator("[data-book-detail]").innerText();
  const screenshotPath = path.join(ARTIFACT_DIR, options.screenshotName);

  await page.screenshot({ fullPage: true, path: screenshotPath });

  const result = {
    hasHorizontalOverflow: await hasOverflow(page),
    hasPlaceholderCopy: PLACEHOLDER_COPY.test(pageText),
    hasPublicSourceReviewStatus:
      (await page.locator("[data-book-source-status]").count()) > 0,
    hasUnsupportedCopy: UNSUPPORTED_PUBLIC_COPY.test(pageText),
    hasVerifiedFactsSection:
      (await page.locator("[data-book-verified-facts]").count()) === 1,
    screenshotSaved: fs.existsSync(screenshotPath),
    slug: options.target.slug,
    visibleFactTerms: await page
      .locator("[data-book-verified-facts] dt")
      .count(),
  };

  await context.close();

  return result;
}

async function inspectStructuredData(page: Page, canonical: string | null) {
  const rawJson =
    (await page.evaluate(
      () =>
        document.querySelector<HTMLScriptElement>(
          "script[type='application/ld+json']",
        )?.textContent ?? "{}",
    )) ?? "{}";
  const parsed = JSON.parse(rawJson) as {
    "@type"?: string;
    offers?: {
      priceCurrency?: string;
      url?: string;
    };
  };

  return {
    offerUrl: parsed.offers?.url ?? "",
    offerUrlMatchesCanonical:
      canonical !== null && parsed.offers?.url === canonical,
    priceCurrency: parsed.offers?.priceCurrency ?? "",
    type: parsed["@type"] ?? "",
  };
}

async function addCurrentEditionToCart(page: Page, editionId: string) {
  const addToCartButton = page.locator("[data-book-add-to-cart-button]");
  await page.waitForFunction(() => {
    const button = document.querySelector<HTMLButtonElement>(
      "[data-book-add-to-cart-button]",
    );

    return Boolean(button && !button.disabled);
  });
  await addToCartButton.evaluate((button) =>
    (button as HTMLButtonElement).click(),
  );
  await page
    .locator("[data-book-add-to-cart-feedback='success']")
    .waitFor({ timeout: 5_000 });

  if (!(await cartContainsEdition(page, editionId))) {
    throw new Error(`Cart did not receive expected edition ${editionId}`);
  }
}

async function cartContainsEdition(page: Page, editionId: string) {
  return page.evaluate(
    ({ cartStorageKey, expectedEditionId }) => {
      const rawCart = window.localStorage.getItem(cartStorageKey);

      if (!rawCart) {
        return false;
      }

      const parsedCart = JSON.parse(rawCart) as {
        items?: { productId?: string; quantity?: number }[];
      };

      return Boolean(
        parsedCart.items?.some(
          (item) =>
            item.productId === expectedEditionId &&
            typeof item.quantity === "number" &&
            item.quantity > 0,
        ),
      );
    },
    { cartStorageKey: CART_STORAGE_KEY, expectedEditionId: editionId },
  );
}

async function inspectFirstScreen(page: Page) {
  return {
    addToCart: await isSelectorInsideFirstViewport(
      page,
      "[data-book-add-to-cart-button]",
    ),
    cover: await isSelectorInsideFirstViewport(page, "[data-book-detail-image]"),
    editionComparison: await isSelectorInsideFirstViewport(
      page,
      "[data-book-edition-comparison]",
    ),
    price: await isSelectorInsideFirstViewport(page, "[data-book-detail-price]"),
    title: await isSelectorInsideFirstViewport(page, "h1"),
  };
}

async function isSelectorInsideFirstViewport(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return rect.top >= 0 && rect.top < window.innerHeight && rect.left >= 0;
  });
}

async function hasOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
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

function parseBaseURL(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Invalid base URL: ${value}`);
  }
}

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }

  return value;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
