import { expect, test } from "@playwright/test";

import { findAvailableBook } from "./helpers/supabase";

const ARTIFACT_DIR = ".agent/artifacts/originkit-t03";

test("homepage category covers reveal without layout shift", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { height: 1000, width: 1440 },
  });
  const page = await context.newPage();
  const runtimeErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const categoryLinks = page.locator(
      '[data-origin-effect="category-cover-reveal"]',
    );
    await expect(categoryLinks).toHaveCount(8);
    const previewSources = await categoryLinks.locator("img").evaluateAll(
      (images) => images.map((image) => image.getAttribute("src") ?? ""),
    );
    expect(previewSources).toHaveLength(16);
    expect(
      previewSources.every((source) => {
        return source.includes("%2Fimages%2Fbooks%2F");
      }),
    ).toBe(true);

    const firstCategory = categoryLinks.first();
    const firstPreview = firstCategory.locator(".case-origin-category-cover");
    await expect(firstPreview).toBeVisible();

    const before = await getElementGeometry(firstCategory);
    const concealedStyle = await firstPreview.evaluate((element) => ({
      clipPath: window.getComputedStyle(element).clipPath,
      opacity: window.getComputedStyle(element).opacity,
    }));
    expect(concealedStyle.clipPath).not.toBe("inset(0px)");

    await firstCategory.focus();
    await expect
      .poll(async () => firstPreview.evaluate((element) => {
        return window.getComputedStyle(element).clipPath;
      }))
      .toBe("inset(0px)");

    const after = await getElementGeometry(firstCategory);
    expect(after).toEqual(before);
    expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);
    expect(runtimeErrors).toEqual([]);

    await page.locator('[data-home-section="categories"]').screenshot({
      path: `${ARTIFACT_DIR}/homepage-desktop-focus-reveal.png`,
    });
  } finally {
    await context.close();
  }
});

test("category cover fallback is stable on touch and reduced motion", async ({
  browser,
}) => {
  const touchContext = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 812, width: 375 },
  });
  const touchPage = await touchContext.newPage();

  try {
    await touchPage.goto("/", { waitUntil: "domcontentloaded" });

    const touchPreview = touchPage
      .locator('[data-origin-effect="category-cover-reveal"]')
      .first()
      .locator(".case-origin-category-cover");
    await expect(touchPreview).toBeVisible();
    await expect
      .poll(async () => touchPreview.evaluate((element) => {
        const styles = window.getComputedStyle(element);

        return {
          clipPath: styles.clipPath,
          opacity: styles.opacity,
          transform: styles.transform,
        };
      }))
      .toEqual({
        clipPath: "none",
        opacity: "1",
        transform: "none",
      });
    expect(await getHorizontalOverflow(touchPage)).toBeLessThanOrEqual(1);

    await touchPage.screenshot({
      fullPage: true,
      path: `${ARTIFACT_DIR}/homepage-mobile-touch-fallback.png`,
    });

    const book = await findAvailableBook(touchPage.request);
    await touchPage.goto(`/products/${book.slug}`, {
      waitUntil: "domcontentloaded",
    });
    const touchMagnifier = touchPage.locator(
      '[data-origin-effect="image-magnifier"]',
    );
    await expect(touchMagnifier).toHaveAttribute(
      "data-origin-magnifier-ready",
      "true",
    );
    await touchPage
      .locator("[data-origin-magnifier-surface]")
      .tap({ position: { x: 80, y: 120 } });
    await expect(touchMagnifier).toHaveAttribute(
      "data-origin-magnifier-active",
      "false",
    );
    await expect(
      touchMagnifier.locator(".case-origin-magnifier-lens"),
    ).toHaveCount(0);
    expect(await getHorizontalOverflow(touchPage)).toBeLessThanOrEqual(1);

    await touchPage.screenshot({
      fullPage: false,
      path: `${ARTIFACT_DIR}/product-detail-mobile-touch-fallback.png`,
    });
  } finally {
    await touchContext.close();
  }

  const reducedContext = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { height: 900, width: 768 },
  });
  const reducedPage = await reducedContext.newPage();

  try {
    await reducedPage.goto("/", { waitUntil: "domcontentloaded" });
    const reducedPreview = reducedPage
      .locator('[data-origin-effect="category-cover-reveal"]')
      .first()
      .locator(".case-origin-category-cover");

    const reducedStyle = await reducedPreview.evaluate((element) => {
      const styles = window.getComputedStyle(element);

      return {
        clipPath: styles.clipPath,
        opacity: styles.opacity,
        transform: styles.transform,
      };
    });
    expect(reducedStyle).toEqual({
      clipPath: "inset(0px)",
      opacity: "1",
      transform: "none",
    });
    expect(await getHorizontalOverflow(reducedPage)).toBeLessThanOrEqual(1);

    await reducedPage.screenshot({
      fullPage: true,
      path: `${ARTIFACT_DIR}/homepage-tablet-reduced-motion.png`,
    });
  } finally {
    await reducedContext.close();
  }
});

test("book detail magnifier is bounded and disabled for reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ height: 1000, width: 1440 });
  const book = await findAvailableBook(page.request);
  await page.goto(`/products/${book.slug}`, {
    waitUntil: "domcontentloaded",
  });

  const magnifier = page.locator('[data-origin-effect="image-magnifier"]');
  const surface = magnifier.locator("[data-origin-magnifier-surface]");
  await expect(magnifier).toBeVisible();
  await expect(magnifier).toHaveAttribute(
    "data-origin-magnifier-ready",
    "true",
  );

  const bounds = await surface.boundingBox();
  expect(bounds).not.toBeNull();

  await page.mouse.move(
    bounds!.x + bounds!.width * 0.62,
    bounds!.y + bounds!.height * 0.42,
  );
  await expect(magnifier).toHaveAttribute(
    "data-origin-magnifier-active",
    "true",
  );

  const lens = magnifier.locator(".case-origin-magnifier-lens");
  await expect(lens).toBeVisible();
  const lensBounds = await lens.boundingBox();
  expect(lensBounds).not.toBeNull();
  expect(lensBounds!.width).toBeLessThanOrEqual(bounds!.width);
  expect(lensBounds!.height).toBeLessThanOrEqual(bounds!.height);
  expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);

  await page.screenshot({
    fullPage: false,
    path: `${ARTIFACT_DIR}/product-detail-desktop-magnifier.png`,
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(1, 1);
  await page.mouse.move(
    bounds!.x + bounds!.width * 0.5,
    bounds!.y + bounds!.height * 0.5,
  );
  await expect(magnifier).toHaveAttribute(
    "data-origin-magnifier-active",
    "false",
  );
  await expect(lens).toHaveCount(0);
});

async function getElementGeometry(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect();

    return {
      height: Math.round(bounds.height),
      width: Math.round(bounds.width),
      x: Math.round(bounds.x + window.scrollX),
      y: Math.round(bounds.y + window.scrollY),
    };
  });
}

async function getHorizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
}
