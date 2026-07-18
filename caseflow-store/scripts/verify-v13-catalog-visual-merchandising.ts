import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";

const TASK_ID = "V13-T06";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v13-t06");
const REPORT_PATH = path.join(ARTIFACT_DIR, "catalog-visual-check.json");
const EXPECTED_RENDERED_CARDS = 24;
const BASE_URL =
  process.env.CATALOG_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

const VIEWPORTS = [
  {
    language: "vi" as const,
    name: "mobile-vi",
    path: "/catalog?page=2",
    screenshotName: "catalog-v13-mobile-vi-page-2.png",
    viewport: { height: 900, width: 375 },
  },
  {
    language: "en" as const,
    name: "desktop-en",
    path: "/catalog",
    screenshotName: "catalog-v13-desktop-en.png",
    viewport: { height: 1100, width: 1440 },
  },
] as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    const viewportChecks = [];
    for (const config of VIEWPORTS) {
      viewportChecks.push(await inspectViewport(browser, config));
    }

    const pass = {
      cardCountPreserved: viewportChecks.every(
        (check) => check.pass.cardCountPreserved,
      ),
      coverAspectRatio: viewportChecks.every((check) => check.pass.coverAspectRatio),
      filterPanelVisible: viewportChecks.every(
        (check) => check.pass.filterPanelVisible,
      ),
      localImagesOnly: viewportChecks.every((check) => check.pass.localImagesOnly),
      noOverflow: viewportChecks.every((check) => check.pass.noOverflow),
      productLinksPreserved: viewportChecks.every(
        (check) => check.pass.productLinksPreserved,
      ),
    };
    const report = {
      taskId: TASK_ID,
      generatedAt: new Date().toISOString(),
      baseURL: BASE_URL,
      ok: Object.values(pass).every(Boolean),
      pass,
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

async function inspectViewport(
  browser: Browser,
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
  await page.goto(config.path, { waitUntil: "domcontentloaded" });
  await waitForCatalog(page);
  await warmLazyImages(page);

  const counts = await readCounts(page);
  const layout = await readLayout(page);
  const coverFrameBoxes = await page
    .locator("[data-catalog-card] [data-v13-cover-frame] > div")
    .evaluateAll((elements) =>
      elements.slice(0, 24).map((element) => {
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
      cardCountPreserved: counts.cards === EXPECTED_RENDERED_CARDS,
      coverAspectRatio:
        coverFrameBoxes.length === EXPECTED_RENDERED_CARDS &&
        coverFrameBoxes.every((box) => box.ratio > 0.62 && box.ratio < 0.72),
      filterPanelVisible: counts.filterPanels === 1,
      localImagesOnly: localImageSourceProblems.length === 0,
      noOverflow: !layout.hasHorizontalOverflow,
      productLinksPreserved: counts.productLinks >= EXPECTED_RENDERED_CARDS,
    },
    screenshotPath,
    viewport: config.viewport,
  };
}

async function waitForCatalog(page: Page) {
  await page.locator("[data-catalog-page]").first().waitFor();
  await page.locator("[data-catalog-filter-panel]").first().waitFor();
  await page.locator("[data-catalog-card] [data-v13-cover-frame]").first().waitFor();
}

async function readCounts(page: Page) {
  return {
    cards: await page.locator("[data-catalog-card]").count(),
    coverFrames: await page
      .locator("[data-catalog-card] [data-v13-cover-frame]")
      .count(),
    filterPanels: await page.locator("[data-catalog-filter-panel]").count(),
    productLinks: await page.locator("[data-catalog-card] a[href^='/products/']").count(),
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

void main();
