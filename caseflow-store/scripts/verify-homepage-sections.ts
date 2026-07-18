import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d27-t01");
const EXPECTED_COUNTS = {
  categories: 8,
  englishCards: 4,
  featuredCards: 4,
  heroCards: 3,
  promotionCards: 4,
  totalEditions: 100,
  translatedGroups: 3,
  translatedLinks: 6,
  trustCards: 4,
  vietnameseCards: 4,
  weekendCards: 4,
} as const;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.HOMEPAGE_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const desktop = await inspectHomepage(browser, baseURL, {
      language: "en",
      screenshotName: "home-desktop-en.png",
      viewport: { height: 1200, width: 1440 },
    });
    const mobile = await inspectHomepage(browser, baseURL, {
      language: "vi",
      screenshotName: "home-mobile-vi.png",
      viewport: { height: 900, width: 375 },
    });
    const pass = {
      desktopNoOverflow: !desktop.hasHorizontalOverflow,
      mobileNoOverflow: !mobile.hasHorizontalOverflow,
      totalCatalogCountVisible:
        desktop.counts.totalEditions === EXPECTED_COUNTS.totalEditions,
      homepageDoesNotRenderAllEditions:
        desktop.counts.curatedEditions < desktop.counts.totalEditions &&
        desktop.counts.bookCards < desktop.counts.totalEditions,
      curatedSectionCounts:
        desktop.counts.heroCards === EXPECTED_COUNTS.heroCards &&
        desktop.counts.categories === EXPECTED_COUNTS.categories &&
        desktop.counts.featuredCards === EXPECTED_COUNTS.featuredCards &&
        desktop.counts.weekendCards === EXPECTED_COUNTS.weekendCards &&
        desktop.counts.translatedGroups === EXPECTED_COUNTS.translatedGroups &&
        desktop.counts.translatedLinks === EXPECTED_COUNTS.translatedLinks &&
        desktop.counts.vietnameseCards === EXPECTED_COUNTS.vietnameseCards &&
        desktop.counts.englishCards === EXPECTED_COUNTS.englishCards &&
        desktop.counts.promotionCards === EXPECTED_COUNTS.promotionCards &&
        desktop.counts.trustCards === EXPECTED_COUNTS.trustCards,
      detailLinksPresent:
        desktop.counts.detailLinks >=
        EXPECTED_COUNTS.heroCards +
          EXPECTED_COUNTS.featuredCards +
          EXPECTED_COUNTS.weekendCards +
          EXPECTED_COUNTS.translatedLinks +
          EXPECTED_COUNTS.vietnameseCards +
          EXPECTED_COUNTS.englishCards +
          EXPECTED_COUNTS.promotionCards,
      languageSpecificCopy:
        desktop.language === "en" &&
        mobile.language === "vi" &&
        desktop.visibleTextChecks.hero &&
        desktop.visibleTextChecks.sections &&
        mobile.visibleTextChecks.hero &&
        mobile.visibleTextChecks.sections,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      desktop,
      expectedCounts: EXPECTED_COUNTS,
      mobile,
      ok,
      pass,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "homepage-sections-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(JSON.stringify({ ok, pass, counts: desktop.counts }, null, 2));

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function inspectHomepage(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    screenshotName: string;
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

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await waitForHomepage(page);

  const counts = await readHomepageCounts(page);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  const language = await page.locator("html").getAttribute("lang");
  const visibleTextChecks = await readVisibleTextChecks(page, options.language);
  const screenshotPath = path.join(ARTIFACT_DIR, options.screenshotName);
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await context.close();

  return {
    counts,
    hasHorizontalOverflow,
    language,
    screenshotPath,
    viewport: options.viewport,
    visibleTextChecks,
  };
}

async function waitForHomepage(page: Page) {
  await page.locator("[data-home-section='hero']").waitFor();
  await page.locator("[data-home-section='trust-shipping']").waitFor();
}

async function readHomepageCounts(page: Page) {
  const homepage = page.locator("main[data-homepage-total-editions]");
  const totalEditions = Number(
    await homepage.getAttribute("data-homepage-total-editions"),
  );
  const curatedEditions = Number(
    await homepage.getAttribute("data-homepage-curated-editions"),
  );

  return {
    bookCards: await page.locator("[data-home-book-card]").count(),
    categories: await page.locator("[data-home-category-card]").count(),
    curatedEditions,
    detailLinks: await page.locator("a[href^='/products/']").count(),
    englishCards: await page.locator("[data-home-english-card]").count(),
    featuredCards: await page.locator("[data-home-featured-card]").count(),
    heroCards: await page.locator("[data-home-hero-card]").count(),
    promotionCards: await page.locator("[data-home-promotion-card]").count(),
    totalEditions,
    translatedGroups: await page.locator("[data-home-translated-group]").count(),
    translatedLinks: await page.locator("[data-home-translated-link]").count(),
    trustCards: await page.locator("[data-home-trust-card]").count(),
    vietnameseCards: await page.locator("[data-home-vietnamese-card]").count(),
    weekendCards: await page.locator("[data-home-weekend-card]").count(),
  };
}

async function readVisibleTextChecks(page: Page, language: Language) {
  const expected =
    language === "vi"
      ? {
          category: "Văn học kinh điển",
          hero: "CaseFlow Books",
        }
      : {
          category: "Classic literature",
          hero: "CaseFlow Books",
        };
  const sectionSelectors = [
    "[data-home-section='featured']",
    "[data-home-section='weekend-starter']",
    "[data-home-section='translated-editions']",
    "[data-home-section='language-offers']",
    "[data-home-section='trust-shipping']",
  ];

  return {
    category: await page.getByText(expected.category).first().isVisible(),
    hero: await page.getByRole("heading", { name: expected.hero }).isVisible(),
    sections: (
      await Promise.all(
        sectionSelectors.map((selector) =>
          page.locator(selector).first().isVisible(),
        ),
      )
    ).every(Boolean),
  };
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("HOMEPAGE_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
