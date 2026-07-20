import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const baseURL = process.env.V18_BASE_URL ?? "http://127.0.0.1:3000";
const artifactId = process.env.V18_ARTIFACT_ID ?? "v18-t01";
const artifactDir = `.agent/artifacts/${artifactId}`;
const manifestPath = "assets/book-covers/sources.json";

mkdirSync(artifactDir, { recursive: true });

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const css = readFileSync("src/app/globals.css", "utf8");
const browser = await chromium.launch();
const findings = [];
const pass = {};

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(baseURL, { waitUntil: "networkidle" });
  await desktop.screenshot({
    fullPage: true,
    path: `${artifactDir}/home-1440.png`,
  });

  pass.desktopSearchVisible = await desktop
    .locator("[data-storefront-search] input[name='q']")
    .isVisible();
  pass.desktopCategoryMenuVisible = await desktop
    .locator("summary", { hasText: /Book categories|Danh mục sách/ })
    .isVisible();
  pass.homeNoOverflow = await hasNoHorizontalOverflow(desktop);

  await desktop.locator("[data-storefront-search] input[name='q']").fill("dracula");
  await Promise.all([
    desktop.waitForURL(/\/catalog\?q=dracula/),
    desktop.locator("[data-storefront-search] button[type='submit']").click(),
  ]);
  pass.searchRoutesToCatalog = desktop.url().includes("/catalog?q=dracula");

  const catalog = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await catalog.goto(`${baseURL}/catalog?language=vi`, { waitUntil: "networkidle" });
  await catalog.screenshot({
    fullPage: true,
    path: `${artifactDir}/catalog-1440.png`,
  });
  pass.catalogNoOverflow = await hasNoHorizontalOverflow(catalog);
  pass.catalogCardMotionClass =
    (await catalog.locator(".case-product-card-motion").count()) >= 1;
  pass.coverObjectContain =
    (await catalog
      .locator("[data-v13-cover-frame] img")
      .first()
      .evaluate((element) => getComputedStyle(element).objectFit)) === "contain";

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(baseURL, { waitUntil: "networkidle" });
  await mobile.locator("[data-mobile-navigation-toggle]").click();
  pass.mobileSearchVisible = await mobile
    .locator("#mobile-site-search")
    .isVisible();
  pass.mobileCategoryLinks =
    (await mobile.locator("#mobile-navigation a[href^='/catalog?category=']").count()) >=
    4;
  await mobile.screenshot({
    fullPage: true,
    path: `${artifactDir}/mobile-menu-390.png`,
  });
  pass.mobileNoOverflow = await hasNoHorizontalOverflow(mobile);

  const detail = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await detail.goto(`${baseURL}/products/pride-and-prejudice-english-special-edition`, {
    waitUntil: "networkidle",
  });
  await detail.mouse.wheel(0, 1200);
  await detail.evaluate(() => {
    window.scrollTo(0, Math.max(900, document.body.scrollHeight / 2));
    window.dispatchEvent(new Event("scroll"));
  });
  await detail.waitForTimeout(400);
  pass.backToTopVisible = await detail.locator("[data-back-to-top]").isVisible();
  pass.detailNoOverflow = await hasNoHorizontalOverflow(detail);
  await detail.screenshot({
    fullPage: true,
    path: `${artifactDir}/detail-390.png`,
  });

  pass.manifestHas500Products = manifest.totals?.products === 500;
  pass.manifestHasEntries = Array.isArray(manifest.entries) && manifest.entries.length === 500;
  pass.manifestNoExternalCoverUrls = manifest.entries.every(
    (entry) => entry.sourceUrl === null,
  );
  pass.manifestMarksSynthetic = manifest.totals?.synthetic === 500;
  pass.motionTokensPresent =
    css.includes("--case-duration-fast") &&
    css.includes(".case-soft-reveal") &&
    css.includes("@media (prefers-reduced-motion: reduce)");

  for (const [key, value] of Object.entries(pass)) {
    if (!value) {
      findings.push(`${key} failed`);
    }
  }
} finally {
  await browser.close();
}

const result = {
  ok: findings.length === 0,
  baseURL,
  generatedAt: new Date().toISOString(),
  pass,
  findings,
  screenshots: {
    home: `${artifactDir}/home-1440.png`,
    catalog: `${artifactDir}/catalog-1440.png`,
    mobileMenu: `${artifactDir}/mobile-menu-390.png`,
    detail: `${artifactDir}/detail-390.png`,
  },
};

writeFileSync(`${artifactDir}/v18-bookstore-experience-check.json`, `${JSON.stringify(result, null, 2)}\n`);

if (!result.ok) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));

async function hasNoHorizontalOverflow(page) {
  return page.evaluate(() => {
    const documentElement = document.documentElement;
    return documentElement.scrollWidth <= documentElement.clientWidth + 1;
  });
}
