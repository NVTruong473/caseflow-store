import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";

const TASK_ID = "V13-T07";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v13-t07");
const REPORT_PATH = path.join(ARTIFACT_DIR, "book-detail-visual-check.json");
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
  edition: {
    id: string;
    slug: string;
  };
};

const VIEWPORTS = [
  {
    language: "vi" as const,
    name: "mobile-vi",
    screenshotName: "book-detail-v13-mobile-vi.png",
    viewport: { height: 1100, width: 375 },
  },
  {
    language: "en" as const,
    name: "desktop-en",
    screenshotName: "book-detail-v13-desktop-en.png",
    viewport: { height: 1200, width: 1440 },
  },
] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const target = await findTargetEdition();
  const browser = await chromium.launch();

  try {
    const viewportChecks = [];
    for (const config of VIEWPORTS) {
      viewportChecks.push(await inspectViewport(browser, target, config));
    }

    const pass = {
      commerceVisible: viewportChecks.every((check) => check.pass.commerceVisible),
      coverAspectRatio: viewportChecks.every((check) => check.pass.coverAspectRatio),
      coverFrameVisible: viewportChecks.every((check) => check.pass.coverFrameVisible),
      editionComparisonVisible: viewportChecks.every(
        (check) => check.pass.editionComparisonVisible,
      ),
      localImagesOnly: viewportChecks.every((check) => check.pass.localImagesOnly),
      noOverflow: viewportChecks.every((check) => check.pass.noOverflow),
    };
    const report = {
      taskId: TASK_ID,
      generatedAt: new Date().toISOString(),
      baseURL: BASE_URL,
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
          pass: report.pass,
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

async function findTargetEdition() {
  const url = new URL("/api/products", BASE_URL);
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
    throw new Error("No active book edition was available for detail visual check");
  }

  return target;
}

async function inspectViewport(
  browser: Browser,
  target: BookCatalogItem,
  config: (typeof VIEWPORTS)[number],
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: config.viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: config.language,
    },
  ]);

  const page = await context.newPage();
  await page.goto(`/products/${target.slug}`, { waitUntil: "domcontentloaded" });
  await waitForDetail(page);
  await warmLazyImages(page);

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
  const screenshotPath = path.join(ARTIFACT_DIR, config.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    counts,
    coverFrameBoxes,
    imageSourceCount: imageSources.length,
    layout,
    localImageSourceProblems,
    name: config.name,
    pass: {
      commerceVisible:
        counts.purchaseControls === 1 &&
        counts.pricePanels >= 1 &&
        counts.confidenceSections === 1,
      coverAspectRatio:
        coverFrameBoxes.length >= 3 &&
        coverFrameBoxes.every((box) => box.ratio > 0.62 && box.ratio < 0.72),
      coverFrameVisible: counts.coverFrames >= 3 && counts.detailImages === 1,
      editionComparisonVisible: counts.editionComparison === 1,
      localImagesOnly: localImageSourceProblems.length === 0,
      noOverflow: !layout.hasHorizontalOverflow,
    },
    screenshotPath,
    viewport: config.viewport,
  };
}

async function waitForDetail(page: Page) {
  await page.locator("[data-book-detail]").waitFor();
  await page.locator("[data-book-detail-image] [data-v13-cover-frame]").waitFor();
  await page.locator("[data-book-purchase-controls]").waitFor();
}

async function readCounts(page: Page) {
  return {
    confidenceSections: await page.locator("[data-book-confidence]").count(),
    coverFrames: await page
      .locator("[data-book-detail] [data-v13-cover-frame]")
      .count(),
    detailImages: await page.locator("[data-book-detail-image]").count(),
    editionComparison: await page.locator("[data-book-edition-comparison]").count(),
    pricePanels: await page.locator("[data-book-detail-price]").count(),
    purchaseControls: await page.locator("[data-book-purchase-controls]").count(),
  };
}

async function readLayout(page: Page) {
  return page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow:
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
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
      const images = Array.from(document.images);

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

void main();
