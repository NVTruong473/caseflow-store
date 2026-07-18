import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const TASK_ID = "V12-T12";
const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t12");
const REPORT_PATH = path.join(ARTIFACT_DIR, "homepage-ui-check.json");
const BASE_URL =
  process.env.HOMEPAGE_VERIFY_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://localhost:3000";
const VIEWPORTS = [
  {
    language: "vi" as const,
    name: "mobile-vi",
    screenshotName: "home-mobile-vi.png",
    viewport: { height: 812, width: 375 },
  },
  {
    language: "en" as const,
    name: "tablet-en",
    screenshotName: "home-tablet-en.png",
    viewport: { height: 900, width: 768 },
  },
  {
    language: "en" as const,
    name: "desktop-en",
    screenshotName: "home-desktop-en.png",
    viewport: { height: 1000, width: 1440 },
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

    const interactionChecks = await inspectInteractions(browser);
    const pass = {
      viewportBasics: viewportChecks.every((check) => check.pass.basic),
      noOverflow: viewportChecks.every((check) => check.pass.noOverflow),
      firstViewportMerchandising: viewportChecks.every(
        (check) => check.pass.firstViewportMerchandising,
      ),
      heroUsesRealCovers: viewportChecks.every(
        (check) => check.pass.heroUsesRealCovers,
      ),
      languageSwitchPreservesRoute:
        interactionChecks.pass.languageSwitchPreservesRoute,
      browseActionWorks: interactionChecks.pass.browseActionWorks,
      detailEntryWorks: interactionChecks.pass.detailEntryWorks,
      cartEntryWorks: interactionChecks.pass.cartEntryWorks,
      keyboardEntryWorks: interactionChecks.pass.keyboardEntryWorks,
    };
    const report = {
      taskId: TASK_ID,
      generatedAt: new Date().toISOString(),
      baseURL: BASE_URL,
      interactionChecks,
      ok: Object.values(pass).every(Boolean),
      pass,
      viewportChecks,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: report.ok,
          artifact: REPORT_PATH,
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
  await setLanguageCookie(context, config.language);
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepage(page);

  const screenshotPath = path.join(ARTIFACT_DIR, config.screenshotName);
  const counts = await readCounts(page);
  const firstViewport = await page.evaluate(() => {
    const categories = document.querySelector("[data-home-section='categories']");
    const hero = document.querySelector("[data-home-section='hero']");
    const categoriesTop = categories?.getBoundingClientRect().top ?? Infinity;
    const heroBottom = hero?.getBoundingClientRect().bottom ?? Infinity;

    return {
      categoriesTop,
      heroBottom,
      innerHeight: window.innerHeight,
    };
  });
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const heroImageChecks = await page.locator("[data-home-hero-card] img").evaluateAll(
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
  const language = await page.locator("html").getAttribute("lang");
  const h1Text = await page.locator("h1").first().innerText();

  await warmLazyImages(page);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    counts,
    firstViewport,
    hasHorizontalOverflow,
    h1Text,
    language,
    name: config.name,
    pass: {
      basic:
        language === config.language &&
        h1Text.trim() === "CaseFlow Books" &&
        counts.heroCards === 3 &&
        counts.catalogCta === 1 &&
        counts.featuredCards === 4 &&
        counts.weekendCards === 4 &&
        counts.translatedGroups >= 3 &&
        counts.vietnameseCards === 4 &&
        counts.englishCards === 4 &&
        counts.promotionCards === 4 &&
        counts.trustCards === 4,
      firstViewportMerchandising:
        firstViewport.heroBottom <= firstViewport.innerHeight &&
        firstViewport.categoriesTop < firstViewport.innerHeight,
      heroUsesRealCovers:
        heroImageChecks.length === 3 &&
        heroImageChecks.every(
          (image) =>
            image.naturalWidth > 0 &&
            image.naturalHeight > 0 &&
            !image.src.includes("book-cover-placeholder"),
        ),
      noOverflow: !hasHorizontalOverflow,
    },
    screenshotPath,
    viewport: config.viewport,
  };
}

async function inspectInteractions(browser: Browser) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { height: 1000, width: 1440 },
  });
  await setLanguageCookie(context, "en");
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepage(page);

  const firstCatalogCta = page.locator("[data-home-cta='catalog']").first();
  await firstCatalogCta.focus();
  const keyboardEntryWorks = await firstCatalogCta.evaluate(
    (element) => document.activeElement === element,
  );

  await firstCatalogCta.click();
  await page.waitForURL("**/catalog");
  const browseActionWorks = page.url().endsWith("/catalog");

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepage(page);
  await Promise.all([
    page.waitForResponse("**/api/preferences/language"),
    page.locator("[data-language-option='vi']").first().click(),
  ]);
  await page.waitForFunction(() => document.documentElement.lang === "vi");
  const languageSwitchPreservesRoute =
    new URL(page.url()).pathname === "/" &&
    (await page.locator("h1").first().innerText()) === "CaseFlow Books";

  await Promise.all([
    page.waitForResponse("**/api/preferences/language"),
    page.locator("[data-language-option='en']").first().click(),
  ]);
  await page.waitForFunction(() => document.documentElement.lang === "en");
  await page.locator("[data-home-hero-card]").first().click();
  await page.waitForURL("**/products/**");
  await page.locator("[data-book-detail]").waitFor();
  const detailEntryWorks = new URL(page.url()).pathname.startsWith("/products/");
  const addButton = page.locator("[data-book-add-to-cart-button]");
  const addButtonEnabled = await addButton.isEnabled();
  if (addButtonEnabled) {
    await addButton.click();
  }
  const cartEntryWorks =
    addButtonEnabled &&
    (await page
      .locator("[data-book-add-to-cart-feedback='success']")
      .isVisible());

  await context.close();

  return {
    pass: {
      browseActionWorks,
      cartEntryWorks,
      detailEntryWorks,
      keyboardEntryWorks,
      languageSwitchPreservesRoute,
    },
  };
}

async function waitForHomepage(page: Page) {
  await page.locator("[data-home-section='hero']").waitFor();
  await page.locator("[data-home-section='language-offers']").waitFor();
  await page.locator("[data-home-section='trust-shipping']").waitFor();
}

async function readCounts(page: Page) {
  return {
    catalogCta: await page.locator("[data-home-cta='catalog']").count(),
    englishCards: await page.locator("[data-home-english-card]").count(),
    featuredCards: await page.locator("[data-home-featured-card]").count(),
    heroCards: await page.locator("[data-home-hero-card]").count(),
    promotionCards: await page.locator("[data-home-promotion-card]").count(),
    translatedGroups: await page
      .locator("[data-home-translated-group]")
      .count(),
    trustCards: await page.locator("[data-home-trust-card]").count(),
    vietnameseCards: await page.locator("[data-home-vietnamese-card]").count(),
    weekendCards: await page.locator("[data-home-weekend-card]").count(),
  };
}

async function warmLazyImages(page: Page) {
  await page.evaluate(`
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
    })()
  `);
}

async function setLanguageCookie(
  context: Awaited<ReturnType<Browser["newContext"]>>,
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
