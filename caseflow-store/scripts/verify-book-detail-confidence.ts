import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d29-t02");
const OLD_ACCESSORY_COPY_PATTERN =
  /compatibility|iPhone|Galaxy|Pixel|screen protector|phone case|charger|cable|accessory/i;

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type BookCatalogItem = {
  id: string;
  slug: string;
  title: string;
  edition: {
    id: string;
    displayTitle: string;
  };
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.BOOK_CONFIDENCE_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const desktop = await inspectConfidence(browser, baseURL, {
      language: "en",
      screenshotName: "book-confidence-desktop-en.png",
      slug: target.slug,
      viewport: { height: 1300, width: 1440 },
    });
    const mobile = await inspectConfidence(browser, baseURL, {
      language: "vi",
      screenshotName: "book-confidence-mobile-vi.png",
      slug: target.slug,
      viewport: { height: 1200, width: 375 },
    });
    const sourceScan = scanDetailSources();
    const pass = {
      buyingConfidenceBilingual:
        desktop.hasConfidenceCopy && mobile.hasConfidenceCopy,
      noOldAccessoryCopy:
        !desktop.hasOldAccessoryCopy &&
        !mobile.hasOldAccessoryCopy &&
        !sourceScan.hasOldAccessoryCopy,
      noOverflow:
        !desktop.hasHorizontalOverflow && !mobile.hasHorizontalOverflow,
      recommendationLinksValid:
        desktop.recommendationLinksValid && mobile.recommendationLinksValid,
      recommendationsVisible:
        desktop.recommendationCardCount >= 4 &&
        mobile.recommendationCardCount >= 4,
      recommendationReasonsVisible:
        desktop.hasRecommendationReasons && mobile.hasRecommendationReasons,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      desktop,
      mobile,
      ok,
      pass,
      sourceScan,
      target,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "book-confidence-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          target: {
            editionId: target.edition.id,
            slug: target.slug,
            title: target.title,
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

async function findTargetEdition(baseURL: string) {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("limit", "1");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Target edition lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const [target] = payload.data ?? [];

  if (!target) {
    throw new Error("No available book edition found for confidence check");
  }

  return target;
}

async function inspectConfidence(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    screenshotName: string;
    slug: string;
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

  await page.goto(`/products/${options.slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-detail]").waitFor();

  const pageText = await page.locator("[data-book-detail]").innerText();
  const confidenceText = await page.locator("[data-book-confidence]").innerText();
  const recommendationSection = page.locator("[data-book-recommendations]");
  await recommendationSection.waitFor();
  const recommendationCardCount = await page
    .locator("[data-book-recommendation-card]")
    .count();
  const recommendationHrefs = await page
    .locator("[data-book-recommendation-link]")
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href)),
    );
  const recommendationStatuses = await Promise.all(
    recommendationHrefs.map(async (href) => {
      const response = await page.request.get(href);

      return {
        href,
        status: response.status(),
      };
    }),
  );
  const hasRecommendationReasons =
    options.language === "vi"
      ? /Cùng tác giả|Cùng danh mục|Cùng ngôn ngữ/.test(pageText)
      : /Same author|Same category|Same language/.test(pageText);
  const hasConfidenceCopy =
    options.language === "vi"
      ? /Vận chuyển|Phương thức thanh toán|Hỗ trợ đổi trả/.test(confidenceText)
      : /Shipping and totals|Payment options|Return support/.test(
          confidenceText,
        );
  const hasHorizontalOverflow = await hasOverflow(page);
  const hasOldAccessoryCopy = OLD_ACCESSORY_COPY_PATTERN.test(pageText);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, options.screenshotName),
  });
  await context.close();

  return {
    hasConfidenceCopy,
    hasHorizontalOverflow,
    hasOldAccessoryCopy,
    hasRecommendationReasons,
    recommendationCardCount,
    recommendationLinks: recommendationStatuses,
    recommendationLinksValid:
      recommendationStatuses.length >= 4 &&
      recommendationStatuses.every((item) => item.status === 200),
    viewport: options.viewport,
  };
}

function scanDetailSources() {
  const sources = [
    "src/app/products/[slug]/page.tsx",
    "src/features/books/book-edition-purchase-controls.tsx",
  ];
  const matches = sources.flatMap((source) => {
    const content = fs.readFileSync(source, "utf8");
    const match = content.match(OLD_ACCESSORY_COPY_PATTERN);

    return match ? [{ match: match[0], source }] : [];
  });

  return {
    hasOldAccessoryCopy: matches.length > 0,
    matches,
    sources,
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
    throw new Error("BOOK_CONFIDENCE_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
