import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";

const TASK_ID = "V13-T05";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v13-t05");
const REPORT_PATH = path.join(ARTIFACT_DIR, "homepage-visual-check.json");
const BASE_URL =
  process.env.HOMEPAGE_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

const VIEWPORTS = [
  {
    language: "vi" as const,
    name: "mobile-vi",
    screenshotName: "home-v13-mobile-vi.png",
    viewport: { height: 900, width: 375 },
  },
  {
    language: "en" as const,
    name: "desktop-en",
    screenshotName: "home-v13-desktop-en.png",
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
      coverAspectRatio: viewportChecks.every((check) => check.pass.coverAspectRatio),
      coverStackVisible: viewportChecks.every((check) => check.pass.coverStackVisible),
      heroCardCountPreserved: viewportChecks.every(
        (check) => check.pass.heroCardCountPreserved,
      ),
      localImagesOnly: viewportChecks.every((check) => check.pass.localImagesOnly),
      noOverflow: viewportChecks.every((check) => check.pass.noOverflow),
      visibleNextSection: viewportChecks.every((check) => check.pass.visibleNextSection),
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
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepage(page);
  await warmLazyImages(page);

  const counts = await readCounts(page);
  const coverStackVisible = await page
    .locator("[data-v13-cover-stack]")
    .first()
    .isVisible();
  const layout = await readLayout(page);
  const coverFrameBoxes = await page
    .locator("[data-v13-cover-frame] > div")
    .evaluateAll((elements) =>
      elements
        .filter((element) => !element.closest("[data-v13-cover-stack]"))
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            height: Math.round(box.height),
            ratio: Number((box.width / box.height).toFixed(3)),
            width: Math.round(box.width),
          };
        })
        .filter((box) => box.width > 0 && box.height > 0)
        .slice(0, 12),
    );
  const imageSources = await page.locator("img").evaluateAll((images) =>
    images.map((image) => {
      const htmlImage = image as HTMLImageElement;
      return htmlImage.currentSrc || htmlImage.src;
    }),
  );
  const screenshotPath = path.join(ARTIFACT_DIR, config.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  const localImageSourceProblems = imageSources.filter(
    (source) =>
      source.startsWith("http") &&
      !source.startsWith(BASE_URL) &&
      !source.includes("/_next/image?url=%2Fimages%2Fbooks%2F"),
  );

  return {
    counts,
    coverFrameBoxes,
    coverStackVisible,
    imageSourceCount: imageSources.length,
    layout,
    localImageSourceProblems,
    name: config.name,
    pass: {
      coverAspectRatio:
        coverFrameBoxes.length >= 10 &&
        coverFrameBoxes.every((box) => box.ratio > 0.62 && box.ratio < 0.72),
      coverStackVisible:
        counts.coverStacks === 1 &&
        counts.coverFrames >= 18 &&
        (config.name.startsWith("mobile") || coverStackVisible),
      heroCardCountPreserved: counts.heroCards === 3,
      localImagesOnly: localImageSourceProblems.length === 0,
      noOverflow: !layout.hasHorizontalOverflow,
      visibleNextSection: layout.categoriesTop < layout.innerHeight,
    },
    screenshotPath,
    viewport: config.viewport,
  };
}

async function waitForHomepage(page: Page) {
  await page.locator("[data-home-section='hero']").waitFor();
  await page.locator("[data-home-hero-card] [data-v13-cover-frame]").first().waitFor();
  await page.locator("[data-home-section='categories']").waitFor();
}

async function readCounts(page: Page) {
  return {
    coverFrames: await page.locator("[data-v13-cover-frame]").count(),
    coverShelves: await page.locator("[data-v13-cover-shelf]").count(),
    coverStacks: await page.locator("[data-v13-cover-stack]").count(),
    heroCards: await page.locator("[data-home-hero-card]").count(),
    productLinks: await page.locator("a[href^='/products/']").count(),
  };
}

async function readLayout(page: Page) {
  return page.evaluate(() => {
    const categories = document.querySelector("[data-home-section='categories']");
    return {
      categoriesTop: categories?.getBoundingClientRect().top ?? Infinity,
      documentWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      innerHeight: window.innerHeight,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
}

async function warmLazyImages(page: Page) {
  await Promise.race([
    page.evaluate(`
      (async () => {
        const step = Math.max(240, Math.floor(window.innerHeight * 0.7));
        const delay = (durationMs) =>
          new Promise((resolve) => window.setTimeout(resolve, durationMs));

        for (
          let position = 0;
          position < document.body.scrollHeight;
          position += step
        ) {
          window.scrollTo(0, position);
          await delay(120);
        }

        window.scrollTo(0, 0);
        await delay(250);

        await Promise.all(
          Array.from(document.images).map((image) => {
            if (image.complete && image.naturalWidth > 0) {
              return Promise.resolve();
            }

            return new Promise((resolve) => {
              const timeout = window.setTimeout(resolve, 2500);
              const finish = () => {
                window.clearTimeout(timeout);
                resolve();
              };

              image.addEventListener("load", finish, { once: true });
              image.addEventListener("error", finish, { once: true });
            });
          }),
        );
      })()
    `),
    page.waitForTimeout(5000),
  ]);
}

void main();
