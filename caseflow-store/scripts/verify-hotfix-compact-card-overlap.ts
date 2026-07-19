import fs from "node:fs";
import path from "node:path";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const TASK_ID = process.env.HOTFIX_CARD_LAYOUT_TASK_ID ?? "HOTFIX-V13-T01";
const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.HOTFIX_CARD_LAYOUT_ARTIFACT_ID ?? "hotfix-v13-t01",
);
const REPORT_PATH = path.join(ARTIFACT_DIR, "compact-card-overlap-check.json");
const BASE_URL =
  process.env.HOTFIX_CARD_LAYOUT_BASE_URL ??
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

type CardBoxCheck = {
  card: Rect;
  content: Rect;
  cover: Rect;
  hasHorizontalCollision: boolean;
  hasRightOverflow: boolean;
  hasTooNarrowContent: boolean;
  index: number;
  slug: string;
};

type Rect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

const DETAIL_VIEWPORTS = [
  {
    height: 900,
    language: "vi" as const,
    name: "detail-mobile-vi",
    screenshotName: "detail-mobile-vi.png",
    width: 390,
  },
  {
    height: 820,
    language: "vi" as const,
    name: "detail-tablet-vi",
    screenshotName: "detail-tablet-vi.png",
    width: 900,
  },
  {
    height: 1100,
    language: "en" as const,
    name: "detail-desktop-en",
    screenshotName: "detail-desktop-en.png",
    width: 1440,
  },
] as const;

const HOME_VIEWPORTS = [
  {
    height: 1000,
    language: "vi" as const,
    name: "home-mobile-vi",
    screenshotName: "home-mobile-vi.png",
    width: 390,
  },
  {
    height: 900,
    language: "vi" as const,
    name: "home-tablet-vi",
    screenshotName: "home-tablet-vi.png",
    width: 900,
  },
  {
    height: 1200,
    language: "en" as const,
    name: "home-desktop-en",
    screenshotName: "home-desktop-en.png",
    width: 1440,
  },
] as const;

const DETAIL_TARGET_CANDIDATES = [
  process.env.HOTFIX_RECOMMENDATION_SLUG,
  "the-old-man-and-the-sea-english-paperback",
  "a-christmas-carol-english-paperback",
  "adventures-of-huckleberry-finn-english-paperback",
].filter(Boolean) as string[];

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch();
  try {
    const detailTarget = await findDetailTarget(browser);
    const detailChecks = [];
    for (const viewport of DETAIL_VIEWPORTS) {
      detailChecks.push(await inspectDetailViewport(browser, detailTarget, viewport));
    }

    const homeChecks = [];
    for (const viewport of HOME_VIEWPORTS) {
      homeChecks.push(await inspectHomeViewport(browser, viewport));
    }

    const allCardChecks = [
      ...detailChecks.flatMap((check) => check.recommendationCards),
      ...detailChecks.flatMap((check) => check.editionOptionCards),
      ...homeChecks.flatMap((check) => [
        ...check.compactCards,
        ...check.heroCards,
        ...check.translatedLinks,
      ]),
    ];
    const pass = {
      cardBoundsVisible: allCardChecks.every(
        (check) =>
          check.card.width > 0 && check.cover.width > 0 && check.content.width > 0,
      ),
      detailRecommendationsPresent: detailChecks.every(
        (check) => check.recommendationCards.length >= 2,
      ),
      homeCompactCardsPresent: homeChecks.every(
        (check) => check.compactCards.length >= 4,
      ),
      homeTranslatedLinksPresent: homeChecks.every(
        (check) => check.translatedLinks.length >= 4,
      ),
      productEditionOptionsPresent: detailChecks.every(
        (check) => check.editionOptionCards.length >= 2,
      ),
      contentWidthReadable: allCardChecks.every(
        (check) => !check.hasTooNarrowContent,
      ),
      noHorizontalCardCollision: allCardChecks.every(
        (check) => !check.hasHorizontalCollision,
      ),
      noHorizontalOverflow: [...detailChecks, ...homeChecks].every(
        (check) => !check.hasPageOverflow,
      ),
      noRightOverflow: allCardChecks.every((check) => !check.hasRightOverflow),
    };
    const report = {
      taskId: TASK_ID,
      baseURL: BASE_URL,
      detailTarget,
      detailChecks,
      generatedAt: new Date().toISOString(),
      homeChecks,
      ok: Object.values(pass).every(Boolean),
      pass,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          artifact: REPORT_PATH,
          detailScreenshots: detailChecks.map((check) => check.screenshotPath),
          detailTarget,
          homeScreenshots: homeChecks.map((check) => check.screenshotPath),
          ok: report.ok,
          pass,
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
      viewport: { height: 820, width: 900 },
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
      // Keep trying deterministic fallbacks and then API-provided slugs.
    }
    await context.close();
  }

  throw new Error("Could not find a product detail page with related book cards");
}

async function fetchCatalogSlugs() {
  const url = new URL("/api/products", BASE_URL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("limit", "12");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  return (payload.data ?? []).map((item) => item.slug);
}

async function inspectDetailViewport(
  browser: Browser,
  target: { recommendationCards: number; slug: string },
  viewport: (typeof DETAIL_VIEWPORTS)[number],
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { height: viewport.height, width: viewport.width },
  });
  await setLanguage(context, viewport.language);

  const page = await context.newPage();
  await page.goto(`/products/${target.slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-detail]").waitFor();
  await page.locator("[data-book-recommendation-card]").first().waitFor();
  await page.locator("[data-book-edition-option]").first().waitFor();
  await warmImages(page);

  const recommendationCards = await readCardChecks(
    page,
    "[data-book-recommendation-card]",
    "[data-v13-cover-frame]",
    "[data-book-recommendation-content]",
  );
  const editionOptionCards = await readCardChecks(
    page,
    "[data-book-edition-option]",
    "[data-v13-cover-frame]",
    "[data-book-edition-option-content]",
  );
  const hasPageOverflow = await readPageOverflow(page);
  const screenshotPath = path.join(ARTIFACT_DIR, viewport.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    hasPageOverflow,
    editionOptionCards,
    name: viewport.name,
    recommendationCards,
    screenshotPath,
    viewport: { height: viewport.height, width: viewport.width },
  };
}

async function inspectHomeViewport(
  browser: Browser,
  viewport: (typeof HOME_VIEWPORTS)[number],
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { height: viewport.height, width: viewport.width },
  });
  await setLanguage(context, viewport.language);

  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-home-shelf]").first().waitFor();
  await warmImages(page);

  const compactCards = await readCardChecks(
    page,
    "[data-home-compact-cover-card]",
    "[data-v13-cover-frame]",
    "[data-home-book-card-content]",
  );
  const translatedLinks = await readCardChecks(
    page,
    "[data-home-translated-link]",
    "[data-v13-cover-frame]",
    "[data-home-translated-link-content]",
  );
  const heroCards =
    viewport.width >= 1024
      ? await readCardChecks(
          page,
          "[data-home-hero-card]",
          "[data-v13-cover-frame]",
          "[data-home-hero-card-content]",
        )
      : [];
  const hasPageOverflow = await readPageOverflow(page);
  const screenshotPath = path.join(ARTIFACT_DIR, viewport.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    compactCards,
    hasPageOverflow,
    heroCards,
    name: viewport.name,
    screenshotPath,
    translatedLinks,
    viewport: { height: viewport.height, width: viewport.width },
  };
}

async function setLanguage(
  context: BrowserContext,
  language: Language,
) {
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: language,
    },
  ]);
}

async function warmImages(page: Page) {
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 250));
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const imagePromises = Array.from(document.images).map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    );
    await Promise.race([
      Promise.all(imagePromises),
      new Promise((resolve) => setTimeout(resolve, 1_500)),
    ]);
  });
}

async function readPageOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
}

async function readCardChecks(
  page: Page,
  cardSelector: string,
  coverSelector: string,
  contentSelector: string,
) {
  return page.locator(cardSelector).evaluateAll(
    (cards, selectors) => {
      return cards.map((card, index) => {
        const cover = card.querySelector(selectors.coverSelector);
        const content = card.querySelector(selectors.contentSelector);
        if (!cover || !content) {
          const emptyBox = card.getBoundingClientRect();
          const empty = {
            bottom: Number(emptyBox.bottom.toFixed(2)),
            height: Number(emptyBox.height.toFixed(2)),
            left: Number(emptyBox.left.toFixed(2)),
            right: Number(emptyBox.right.toFixed(2)),
            top: Number(emptyBox.top.toFixed(2)),
            width: Number(emptyBox.width.toFixed(2)),
          };
          return {
            card: empty,
            content: empty,
            cover: empty,
            hasHorizontalCollision: true,
            hasRightOverflow: true,
            hasTooNarrowContent: true,
            index,
            slug:
              card.getAttribute("data-book-recommendation-card") ??
              card.getAttribute("data-book-edition-option") ??
              card.getAttribute("data-home-compact-cover-card") ??
              card.getAttribute("data-home-hero-card") ??
              card.getAttribute("data-home-translated-link") ??
              `card-${index}`,
          };
        }

        const rawCardRect = card.getBoundingClientRect();
        const rawCoverRect = cover.getBoundingClientRect();
        const rawContentRect = content.getBoundingClientRect();
        const cardRect = {
          bottom: Number(rawCardRect.bottom.toFixed(2)),
          height: Number(rawCardRect.height.toFixed(2)),
          left: Number(rawCardRect.left.toFixed(2)),
          right: Number(rawCardRect.right.toFixed(2)),
          top: Number(rawCardRect.top.toFixed(2)),
          width: Number(rawCardRect.width.toFixed(2)),
        };
        const coverRect = {
          bottom: Number(rawCoverRect.bottom.toFixed(2)),
          height: Number(rawCoverRect.height.toFixed(2)),
          left: Number(rawCoverRect.left.toFixed(2)),
          right: Number(rawCoverRect.right.toFixed(2)),
          top: Number(rawCoverRect.top.toFixed(2)),
          width: Number(rawCoverRect.width.toFixed(2)),
        };
        const contentRect = {
          bottom: Number(rawContentRect.bottom.toFixed(2)),
          height: Number(rawContentRect.height.toFixed(2)),
          left: Number(rawContentRect.left.toFixed(2)),
          right: Number(rawContentRect.right.toFixed(2)),
          top: Number(rawContentRect.top.toFixed(2)),
          width: Number(rawContentRect.width.toFixed(2)),
        };
        const tolerance = 1;

        return {
          card: cardRect,
          content: contentRect,
          cover: coverRect,
          hasHorizontalCollision: coverRect.right > contentRect.left + tolerance,
          hasRightOverflow:
            coverRect.right > cardRect.right + tolerance ||
            contentRect.right > cardRect.right + tolerance,
          hasTooNarrowContent: contentRect.width < 96,
          index,
          slug:
            card.getAttribute("data-book-recommendation-card") ??
            card.getAttribute("data-book-edition-option") ??
            card.getAttribute("data-home-compact-cover-card") ??
            card.getAttribute("data-home-hero-card") ??
            card.getAttribute("data-home-translated-link") ??
            `card-${index}`,
        };
      });
    },
    { contentSelector, coverSelector },
  ) as Promise<CardBoxCheck[]>;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
