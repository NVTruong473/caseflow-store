import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.PAYQR_UI_ARTIFACT_ID ?? "payqr-t01",
);
const REPORT_PATH = path.join(ARTIFACT_DIR, "ui-regression-check.json");
const BASE_URL =
  process.env.PAYQR_UI_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  "http://127.0.0.1:3000";

const DETAIL_TARGETS = [
  process.env.PAYQR_UI_DETAIL_SLUG,
  "the-picture-of-dorian-gray-vietnamese-paperback",
  "a-christmas-carol-vietnamese-paperback",
  "a-christmas-carol-english-paperback",
].filter(Boolean) as string[];

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch();

  try {
    const detailSlug = await findDetailSlug(browser);
    const checks = [
      await inspectHome(browser, "desktop-home-vi", {
        height: 900,
        width: 1440,
      }),
      await inspectCatalog(browser, "desktop-catalog-vi", {
        height: 820,
        width: 920,
      }),
      await inspectCatalog(browser, "mobile-catalog-vi", {
        height: 900,
        width: 375,
      }),
      await inspectDetail(browser, detailSlug, "desktop-detail-vi", {
        height: 920,
        width: 1280,
      }),
      await inspectDetail(browser, detailSlug, "mobile-detail-vi", {
        height: 900,
        width: 390,
      }),
    ];
    const homeCheck = checks.find((check) => check.kind === "home");
    const catalogChecks = checks.filter((check) => check.kind === "catalog");
    const detailChecks = checks.filter((check) => check.kind === "detail");
    const pass = {
      footerSupportVisible: checks.every((check) => check.pass.footerSupportVisible),
      headerBrandNotClipped: checks.every((check) => check.pass.headerBrandNotClipped),
      noHorizontalOverflow: checks.every((check) => check.pass.noHorizontalOverflow),
      noInternalHeroCounts: Boolean(
        homeCheck &&
          "noInternalHeroCounts" in homeCheck.pass &&
          homeCheck.pass.noInternalHeroCounts,
      ),
      noNarrowResultCount: catalogChecks.every(
        (check) =>
          "noNarrowResultCount" in check.pass && check.pass.noNarrowResultCount,
      ),
      noNarrowVerifiedFacts: detailChecks.every(
        (check) =>
          "noNarrowVerifiedFacts" in check.pass &&
          check.pass.noNarrowVerifiedFacts,
      ),
    };
    const report = {
      baseURL: BASE_URL,
      checks,
      detailSlug,
      generatedAt: new Date().toISOString(),
      ok: Object.values(pass).every(Boolean),
      pass,
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          artifact: REPORT_PATH,
          detailSlug,
          ok: report.ok,
          pass,
          screenshots: checks.map((check) => check.screenshotPath),
        },
        null,
        2,
      ),
    );

    if (!report.ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function inspectHome(
  browser: Browser,
  name: string,
  viewport: { height: number; width: number },
) {
  const page = await openVietnamesePage(browser, "/", viewport);
  await page.locator("[data-home-section='hero']").waitFor();
  const text = await page.locator("[data-home-section='hero']").innerText();
  const common = await inspectCommonLayout(page);
  const screenshotPath = await capture(page, `${name}.png`);
  await page.context().close();

  return {
    kind: "home",
    name,
    pass: {
      ...common.pass,
      noInternalHeroCounts:
        !text.includes("50 / 50") &&
        !text.includes("100 ấn bản") &&
        !text.includes("100 sellable") &&
        !/Gợi ý nhanh|Quick discovery|Hiển thị rõ|Visible stock|stock visibility|checkout theo tài khoản|account-gated checkout/i.test(
          text,
        ),
    },
    screenshotPath,
    textSample: text.slice(0, 400),
    viewport,
  };
}

async function inspectCatalog(
  browser: Browser,
  name: string,
  viewport: { height: number; width: number },
) {
  const page = await openVietnamesePage(browser, "/catalog", viewport);
  await page.locator("[data-catalog-result-count]").waitFor();
  const resultBox = await page
    .locator("[data-catalog-result-count]")
    .evaluate((element) => {
      const box = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        height: Math.round(box.height),
        lineHeight: Number.parseFloat(style.lineHeight),
        width: Math.round(box.width),
      };
    });
  const common = await inspectCommonLayout(page);
  const screenshotPath = await capture(page, `${name}.png`);
  await page.context().close();

  return {
    kind: "catalog",
    name,
    pass: {
      ...common.pass,
      noNarrowResultCount:
        resultBox.width >= 180 && resultBox.height <= resultBox.lineHeight * 3.4,
    },
    resultBox,
    screenshotPath,
    viewport,
  };
}

async function inspectDetail(
  browser: Browser,
  slug: string,
  name: string,
  viewport: { height: number; width: number },
) {
  const page = await openVietnamesePage(browser, `/products/${slug}`, viewport);
  await page.locator("[data-book-detail]").waitFor();
  await page.locator("[data-book-edition-identity]").waitFor();
  const termBoxes = await page
    .locator("[data-book-edition-identity] dd")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        const parentBox = element.parentElement?.getBoundingClientRect();
        return {
          height: Math.round(box.height),
          parentRight: Math.round(parentBox?.right ?? box.right),
          right: Math.round(box.right),
          text: element.textContent?.trim() ?? "",
          width: Math.round(box.width),
        };
      }),
    );
  const common = await inspectCommonLayout(page);
  const screenshotPath = await capture(page, `${name}.png`);
  await page.context().close();

  return {
    kind: "detail",
    name,
    pass: {
      ...common.pass,
      noNarrowVerifiedFacts: termBoxes.every(
        (box) => box.right <= box.parentRight + 2 && box.width >= 42,
      ),
    },
    screenshotPath,
    termBoxes,
    viewport,
  };
}

async function inspectCommonLayout(page: Page) {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  const brand = await page.locator("[data-site-header-brand]").evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
      width: Math.round(box.width),
    };
  });
  const footerText = await page.locator("[data-site-footer]").innerText();

  return {
    footerText: footerText.slice(0, 500),
    layout,
    pass: {
      footerSupportVisible:
        footerText.includes("1900 636 879") &&
        footerText.includes("caseflowbooks.vn") &&
        footerText.includes("© 2026 CaseFlow Books"),
      headerBrandNotClipped: brand.text.includes("CaseFlow Books") && brand.width >= 150,
      noHorizontalOverflow: layout.scrollWidth <= layout.clientWidth + 1,
    },
  };
}

async function findDetailSlug(browser: Browser) {
  for (const slug of DETAIL_TARGETS) {
    const page = await openVietnamesePage(browser, `/products/${slug}`, {
      height: 900,
      width: 900,
    });

    try {
      await page.locator("[data-book-detail]").waitFor({ timeout: 5_000 });
      await page.context().close();
      return slug;
    } catch {
      await page.context().close();
    }
  }

  throw new Error("Could not find a product detail page for UI regression check");
}

async function openVietnamesePage(
  browser: Browser,
  pathname: string,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: "vi",
    },
  ]);
  const page = await context.newPage();
  await page.goto(pathname, { waitUntil: "domcontentloaded" });
  await warmImages(page);

  return page;
}

async function warmImages(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

async function capture(page: Page, filename: string) {
  const screenshotPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ fullPage: true, path: screenshotPath });

  return screenshotPath;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
