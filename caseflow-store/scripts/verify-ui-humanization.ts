import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "@playwright/test";

const baseUrl = process.env.UIH_BASE_URL ?? "http://127.0.0.1:3000";
const taskId = process.env.UIH_TASK_ID ?? "ui-humanization-t01";
const artifactDir = path.join(".agent", "artifacts", taskId);
const detailSlug =
  process.env.UIH_DETAIL_SLUG ?? "a-christmas-carol-english-collector-special";

type CheckResult = {
  ok: boolean;
  pass: Record<string, boolean>;
  screenshots: string[];
};

async function main() {
  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch();
  const screenshots: string[] = [];
  const pass: Record<string, boolean> = {};

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await goto(page, "/");
    pass.homeNoOverflowDesktop = await hasNoHorizontalOverflow(page);
    pass.publicHeaderNoAdmin = await headerDoesNotExposeAdmin(page);
    pass.heroUsesReadingTable = await page.locator("[data-home-hero-proof]").isVisible();
    pass.heroNoCurrencyRateDisclosure = !(await textInLocator(
      page,
      "[data-home-section='hero']",
    )).includes("Rate source");
    screenshots.push(await screenshot(page, "home-1440.png"));

    await page.setViewportSize({ width: 375, height: 812 });
    await goto(page, "/");
    pass.homeNoOverflowMobile = await hasNoHorizontalOverflow(page);
    pass.mobileMenuVisible = await page
      .getByRole("button", { name: /open navigation menu|mở menu điều hướng/i })
      .isVisible();
    screenshots.push(await screenshot(page, "home-375.png"));

    await page.setViewportSize({ width: 1440, height: 900 });
    await goto(page, "/catalog");
    pass.catalogNoOverflowDesktop = await hasNoHorizontalOverflow(page);
    pass.catalogNoTechnicalCopy = !(await page.locator("main").innerText()).match(
      /URL-backed|safe cover assets|loading every edition/i,
    );
    pass.catalogQuickLinksAreShelfLinks = await page
      .locator("[data-catalog-quick-links] a")
      .evaluateAll((links) =>
        links.length >= 6 &&
        links.every((link) => {
          const style = window.getComputedStyle(link);
          return style.borderBottomWidth !== "0px" && style.backgroundColor === "rgba(0, 0, 0, 0)";
        }),
      );
    screenshots.push(await screenshot(page, "catalog-1440.png"));

    await page.setViewportSize({ width: 768, height: 900 });
    await goto(page, "/catalog");
    pass.catalogNoOverflowTablet = await hasNoHorizontalOverflow(page);
    screenshots.push(await screenshot(page, "catalog-768.png"));

    await page.setViewportSize({ width: 375, height: 812 });
    await goto(page, `/products/${detailSlug}`);
    pass.detailNoOverflowMobile = await hasNoHorizontalOverflow(page);
    await page.locator("[data-book-edition-identity]").scrollIntoViewIfNeeded();
    const identityText = await textInLocator(page, "[data-book-edition-identity]");
    pass.detailIdentityNaturalCopy =
      /Edition notes|Ghi chú ấn bản/.test(identityText) &&
      !/store checks account|Cửa hàng kiểm tra tài khoản/i.test(identityText);
    pass.detailTermsDoNotOverflow = await page
      .locator("[data-book-edition-identity] dd")
      .evaluateAll((items) =>
        items.every((item) => item.scrollWidth <= item.clientWidth + 1),
      );
    screenshots.push(await screenshot(page, "detail-identity-375.png"));

    pass.keyboardFocusVisible = await verifyKeyboardFocus(page);
    pass.reducedMotionGuard = await verifyReducedMotion(browser);

    await page.close();
  } finally {
    await browser.close();
  }

  const result: CheckResult = {
    ok: Object.values(pass).every(Boolean),
    pass,
    screenshots,
  };
  fs.writeFileSync(
    path.join(artifactDir, "ui-humanization-check.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

async function goto(page: Page, route: string) {
  await page.goto(new URL(route, baseUrl).toString(), {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
}

async function hasNoHorizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
}

async function headerDoesNotExposeAdmin(page: Page) {
  const text = (await page.getByRole("banner").innerText())
    .replace(/\s+/g, " ")
    .trim();
  return !/Admin|Quản trị/.test(text);
}

async function textInLocator(page: Page, selector: string) {
  return (await page.locator(selector).innerText()).replace(/\s+/g, " ").trim();
}

async function screenshot(page: Page, fileName: string) {
  const filePath = path.join(artifactDir, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function verifyKeyboardFocus(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await goto(page, "/");
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return false;
    const style = window.getComputedStyle(active);
    return style.outlineStyle !== "none" && style.outlineWidth !== "0px";
  });
}

async function verifyReducedMotion(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await goto(page, "/");
  const duration = await page
    .getByRole("link", { name: /Browse books|Duyệt sách/i })
    .evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        duration: style.transitionDuration,
        property: style.transitionProperty,
      };
    });
  await context.close();

  return (
    duration.property === "none" ||
    duration.duration === "0.01ms" ||
    duration.duration === "0s"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
