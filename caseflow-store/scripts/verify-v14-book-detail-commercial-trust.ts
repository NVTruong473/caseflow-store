import fs from "node:fs";
import path from "node:path";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const TASK_ID = "V14-T07";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v14-t07");
const REPORT_PATH = path.join(
  ARTIFACT_DIR,
  "book-detail-commercial-trust-check.json",
);
const BASE_URL =
  process.env.BOOK_DETAIL_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type BookCatalogItem = {
  slug: string;
  title: string;
};

type Rect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type CardBoxCheck = {
  card: Rect;
  content: Rect;
  cover: Rect;
  hasHorizontalCollision: boolean;
  hasRightOverflow: boolean;
  index: number;
  slug: string;
};

const VIEWPORTS = [
  {
    height: 1050,
    language: "vi" as const,
    name: "mobile-vi",
    screenshotName: "book-detail-v14-mobile-vi.png",
    width: 390,
  },
  {
    height: 950,
    language: "vi" as const,
    name: "tablet-vi",
    screenshotName: "book-detail-v14-tablet-vi.png",
    width: 900,
  },
  {
    height: 1200,
    language: "en" as const,
    name: "desktop-en",
    screenshotName: "book-detail-v14-desktop-en.png",
    width: 1440,
  },
] as const;

const DETAIL_TARGET_CANDIDATES = [
  process.env.V14_BOOK_DETAIL_SLUG,
  "the-old-man-and-the-sea-english-paperback",
  "a-christmas-carol-english-paperback",
  "adventures-of-huckleberry-finn-english-paperback",
].filter(Boolean) as string[];

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    const target = await findDetailTarget(browser);
    const viewportChecks = [];

    for (const viewport of VIEWPORTS) {
      viewportChecks.push(await inspectViewport(browser, target, viewport));
    }

    const allRecommendationCards = viewportChecks.flatMap(
      (check) => check.recommendationCards,
    );
    const pass = {
      commerceTrustVisible: viewportChecks.every(
        (check) =>
          check.counts.commercialProof === 1 &&
          check.counts.confidenceSections === 1 &&
          check.counts.identitySections === 1,
      ),
      coverAspectRatio: viewportChecks.every(
        (check) =>
          check.coverFrameBoxes.length >= 3 &&
          check.coverFrameBoxes.every((box) => box.ratio > 0.62 && box.ratio < 0.72),
      ),
      detailBasicsVisible: viewportChecks.every(
        (check) =>
          check.counts.detailPages === 1 &&
          check.counts.detailImages === 1 &&
          check.counts.editionComparison === 1 &&
          check.counts.pricePanels >= 1 &&
          check.counts.purchaseControls === 1,
      ),
      localImagesOnly: viewportChecks.every(
        (check) => check.localImageSourceProblems.length === 0,
      ),
      noHorizontalCardCollision: allRecommendationCards.every(
        (check) => !check.hasHorizontalCollision,
      ),
      noHorizontalOverflow: viewportChecks.every(
        (check) => !check.layout.hasHorizontalOverflow,
      ),
      noRecommendationRightOverflow: allRecommendationCards.every(
        (check) => !check.hasRightOverflow,
      ),
      recommendationsVisible: viewportChecks.every(
        (check) => check.recommendationCards.length >= 2,
      ),
    };
    const report = {
      taskId: TASK_ID,
      baseURL: BASE_URL,
      generatedAt: new Date().toISOString(),
      ok: Object.values(pass).every(Boolean),
      pass,
      target,
      viewportChecks,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          artifact: REPORT_PATH,
          ok: report.ok,
          pass,
          screenshots: viewportChecks.map((check) => check.screenshotPath),
          target: target.slug,
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

async function findDetailTarget(browser: Browser) {
  const apiSlugs = await fetchCatalogSlugs();
  const candidates = [...new Set([...DETAIL_TARGET_CANDIDATES, ...apiSlugs])];

  for (const slug of candidates) {
    const context = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { height: 900, width: 900 },
    });
    await setLanguage(context, "vi");
    const page = await context.newPage();
    try {
      await page.goto(`/products/${slug}`, { waitUntil: "domcontentloaded" });
      await page.locator("[data-book-detail]").waitFor({ timeout: 5_000 });
      const recommendationCards = await page
        .locator("[data-book-recommendation-card]")
        .count();
      if (recommendationCards >= 2) {
        await context.close();
        return { recommendationCards, slug };
      }
    } catch {
      // Continue through deterministic candidates, then API-provided slugs.
    }
    await context.close();
  }

  throw new Error("Could not find a product detail page with recommendations");
}

async function fetchCatalogSlugs() {
  const url = new URL("/api/products", BASE_URL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("limit", "16");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  return (payload.data ?? []).map((item) => item.slug);
}

async function inspectViewport(
  browser: Browser,
  target: { recommendationCards: number; slug: string },
  viewport: (typeof VIEWPORTS)[number],
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { height: viewport.height, width: viewport.width },
  });
  await setLanguage(context, viewport.language);

  const page = await context.newPage();
  await page.goto(`/products/${target.slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-detail]").waitFor();
  await page.locator("[data-book-commercial-proof]").waitFor();
  await page.locator("[data-book-edition-identity]").waitFor();
  await page.locator("[data-book-recommendation-card]").first().waitFor();
  await warmImages(page);

  const counts = await readCounts(page);
  const layout = await readLayout(page);
  const coverFrameBoxes = await page
    .locator("[data-book-detail] [data-v13-cover-frame] > div")
    .evaluateAll((elements) =>
      elements.slice(0, 8).map((element) => {
        const box = element.getBoundingClientRect();
        return {
          height: Math.round(box.height),
          ratio: Number((box.width / box.height).toFixed(3)),
          width: Math.round(box.width),
        };
      }),
    );
  const recommendationCards = await readCardChecks(
    page,
    "[data-book-recommendation-card]",
    "[data-v13-cover-frame]",
    "[data-book-recommendation-content]",
  );
  const imageSources = await page.locator("img").evaluateAll((images) =>
    images.map((image) => {
      const htmlImage = image as HTMLImageElement;
      return htmlImage.currentSrc || htmlImage.src;
    }),
  );
  const localImageSourceProblems = imageSources.filter(
    (source) =>
      source.startsWith("http") &&
      !source.startsWith(BASE_URL) &&
      !source.includes("/_next/image?url=%2Fimages%2Fbooks%2F"),
  );
  const screenshotPath = path.join(ARTIFACT_DIR, viewport.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    counts,
    coverFrameBoxes,
    imageSourceCount: imageSources.length,
    layout,
    localImageSourceProblems,
    name: viewport.name,
    recommendationCards,
    screenshotPath,
    viewport,
  };
}

async function setLanguage(context: BrowserContext, language: Language) {
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: language,
    },
  ]);
}

async function readCounts(page: Page) {
  return {
    commercialProof: await page.locator("[data-book-commercial-proof]").count(),
    confidenceSections: await page.locator("[data-book-confidence]").count(),
    detailImages: await page.locator("[data-book-detail-image]").count(),
    detailPages: await page.locator("[data-book-detail]").count(),
    editionComparison: await page
      .locator("[data-book-edition-comparison]")
      .count(),
    identitySections: await page.locator("[data-book-edition-identity]").count(),
    pricePanels: await page.locator("[data-book-detail-price]").count(),
    purchaseControls: await page.locator("[data-book-purchase-controls]").count(),
  };
}

async function readCardChecks(
  page: Page,
  cardSelector: string,
  coverSelector: string,
  contentSelector: string,
) {
  return page.locator(cardSelector).evaluateAll(
    (cards, selectors) =>
      cards.map((card, index) => {
        const cardElement = card as HTMLElement;
        const cover = cardElement.querySelector(selectors.coverSelector);
        const content = cardElement.querySelector(selectors.contentSelector);

        if (!cover || !content) {
          throw new Error(`Card ${index} is missing cover or content`);
        }

        const cardRect = cardElement.getBoundingClientRect();
        const coverRect = cover.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const cardBox = {
          bottom: Math.round(cardRect.bottom),
          height: Math.round(cardRect.height),
          left: Math.round(cardRect.left),
          right: Math.round(cardRect.right),
          top: Math.round(cardRect.top),
          width: Math.round(cardRect.width),
        };
        const coverBox = {
          bottom: Math.round(coverRect.bottom),
          height: Math.round(coverRect.height),
          left: Math.round(coverRect.left),
          right: Math.round(coverRect.right),
          top: Math.round(coverRect.top),
          width: Math.round(coverRect.width),
        };
        const contentBox = {
          bottom: Math.round(contentRect.bottom),
          height: Math.round(contentRect.height),
          left: Math.round(contentRect.left),
          right: Math.round(contentRect.right),
          top: Math.round(contentRect.top),
          width: Math.round(contentRect.width),
        };
        const hasHorizontalCollision = coverBox.right > contentBox.left - 1;
        const hasRightOverflow = contentBox.right > cardBox.right + 1;

        return {
          card: cardBox,
          content: contentBox,
          cover: coverBox,
          hasHorizontalCollision,
          hasRightOverflow,
          index,
          slug: cardElement.dataset.bookRecommendationCard ?? `card-${index}`,
        };
      }),
    { contentSelector, coverSelector },
  ) as Promise<CardBoxCheck[]>;
}

async function readLayout(page: Page) {
  return page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
}

async function warmImages(page: Page) {
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

      for (const image of Array.from(document.images)) {
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

void main();
