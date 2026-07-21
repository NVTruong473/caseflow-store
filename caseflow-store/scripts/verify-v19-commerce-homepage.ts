import fs from "node:fs";
import path from "node:path";

import { chromium, type Page } from "@playwright/test";

const baseURL = process.env.V19_BASE_URL ?? "http://127.0.0.1:3000";
const artifactId = process.env.V19_ARTIFACT_ID ?? "v19-t03";
const expectGutenbergCovers = process.env.V19_EXPECT_GUTENBERG_COVERS === "true";
const artifactDir = path.join(".agent", "artifacts", artifactId);
const reportPath = path.join(artifactDir, "commerce-homepage-check.json");

fs.mkdirSync(artifactDir, { recursive: true });

async function main() {
  const browser = await chromium.launch();
  const findings: string[] = [];
  const pass: Record<string, boolean> = {};

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(baseURL, { waitUntil: "networkidle" });
    await desktop.locator("[data-home-section='hero']").waitFor();
    await desktop.screenshot({
      fullPage: true,
      path: path.join(artifactDir, "home-v19-desktop.png"),
    });

    pass.heroSearchVisible = await desktop
      .locator("[data-home-hero-search] input[name='q']")
      .isVisible();
    pass.heroQuickLinksVisible =
      (await desktop.locator("[data-home-hero-quick-link]").count()) >= 4;
    pass.frontTableVisible = await desktop
      .locator("[data-home-hero-books]")
      .isVisible();
    pass.heroCardCountPreserved =
      (await desktop.locator("[data-home-hero-card]").count()) === 3;
    pass.trackOrderCtaVisible = await desktop
      .locator("[data-home-cta='track-order']")
      .isVisible();
    pass.desktopNoOverflow = await hasNoHorizontalOverflow(desktop);
    pass.desktopHeroTextReadable = await textBlocksHaveReasonableWidth(desktop);
    const desktopBodyText = await desktop.locator("body").innerText();
    pass.noFakeProofCopy =
      !/trusted by thousands|bestseller #1|4\.9\/5|triệu khách/i.test(
        desktopBodyText,
      );
    pass.heroSearchRoutes = await verifyHeroSearchRoutes(desktop);
    pass.coverImagesNotClipped = await coverImagesAreVisiblySized(desktop);
    pass.gutenbergCoversWhenExpected =
      !expectGutenbergCovers ||
      (await desktop
        .locator("img[src*='gutenberg-covers'], img[srcset*='gutenberg-covers']")
        .count()) >= 1;

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(baseURL, { waitUntil: "networkidle" });
    await mobile.locator("[data-home-section='hero']").waitFor();
    await mobile.screenshot({
      fullPage: true,
      path: path.join(artifactDir, "home-v19-mobile.png"),
    });

    pass.mobileSearchVisible = await mobile
      .locator("[data-home-hero-search] input[name='q']")
      .isVisible();
    pass.mobileQuickLinksVisible =
      (await mobile.locator("[data-home-hero-quick-link]").count()) >= 4;
    pass.mobileNoOverflow = await hasNoHorizontalOverflow(mobile);
    pass.mobileHeroCardsVisible =
      (await mobile.locator("[data-home-hero-card]").count()) === 3;

    for (const [key, value] of Object.entries(pass)) {
      if (!value) {
        findings.push(`${key} failed`);
      }
    }

    const report = {
      baseURL,
      expectGutenbergCovers,
      findings,
      generatedAt: new Date().toISOString(),
      ok: findings.length === 0,
      pass,
      screenshots: {
        desktop: path.join(artifactDir, "home-v19-desktop.png"),
        mobile: path.join(artifactDir, "home-v19-mobile.png"),
      },
    };

    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

    if (!report.ok) {
      console.error(JSON.stringify(report, null, 2));
      process.exit(1);
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

async function verifyHeroSearchRoutes(page: Page) {
  await page.locator("[data-home-hero-search] input[name='q']").fill("dracula");
  await Promise.all([
    page.waitForURL(/\/catalog\?q=dracula/),
    page.locator("[data-home-hero-search] button[type='submit']").click(),
  ]);

  return page.url().includes("/catalog?q=dracula");
}

async function hasNoHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth <= root.clientWidth + 1;
  });
}

async function textBlocksHaveReasonableWidth(page: Page) {
  return page.evaluate(() => {
    const hero = document.querySelector("[data-home-section='hero']");
    if (!hero) return false;
    const paragraphs = Array.from(hero.querySelectorAll("p"));

    return paragraphs.every((paragraph) => {
      const width = paragraph.getBoundingClientRect().width;
      return width <= 760;
    });
  });
}

async function coverImagesAreVisiblySized(page: Page) {
  return page.locator("[data-home-hero-card] img").evaluateAll((images) =>
    images.every((image) => {
      const rect = image.getBoundingClientRect();
      return rect.width >= 52 && rect.height >= 78;
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
