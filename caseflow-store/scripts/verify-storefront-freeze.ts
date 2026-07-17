import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d30-t02");

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
    language: "en" | "vi";
  };
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.STOREFRONT_FREEZE_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const targets = {
      en: await findTargetEdition(baseURL, "en"),
      vi: await findTargetEdition(baseURL, "vi"),
    };
    const desktop = await inspectStorefront(browser, baseURL, {
      language: "en",
      label: "desktop-en",
      targets,
      viewport: { height: 1200, width: 1440 },
    });
    const mobile = await inspectStorefront(browser, baseURL, {
      language: "vi",
      label: "mobile-vi",
      targets,
      viewport: { height: 1000, width: 375 },
    });
    const languageSwitch = await inspectLanguageSwitch(browser, baseURL);
    const pass = {
      cartFlowStable:
        desktop.cart.drawerItemCount === 2 && mobile.cart.drawerItemCount === 2,
      catalogStable:
        desktop.catalog.cardCount >= 20 && mobile.catalog.cardCount >= 20,
      detailStable: desktop.detail.visible && mobile.detail.visible,
      homepageStable:
        desktop.home.totalEditions === 100 &&
        mobile.home.totalEditions === 100 &&
        desktop.home.curatedEditions < desktop.home.totalEditions &&
        mobile.home.curatedEditions < mobile.home.totalEditions,
      languageSwitchStable: languageSwitch.switchedToVietnamese,
      noOverflow:
        desktop.noOverflow &&
        mobile.noOverflow &&
        !languageSwitch.hasHorizontalOverflow,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      desktop,
      languageSwitch,
      mobile,
      ok,
      pass,
      targets,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "storefront-freeze-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          targets: {
            en: targets.en.slug,
            vi: targets.vi.slug,
          },
        },
        null,
        2,
      ),
    );

    if (!ok) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

async function findTargetEdition(baseURL: string, language: "en" | "vi") {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("language", language);
  url.searchParams.set("limit", "1");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Target ${language} edition lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const [target] = payload.data ?? [];

  if (!target) {
    throw new Error(`No ${language} target edition found`);
  }

  return target;
}

async function inspectStorefront(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    label: string;
    targets: { en: BookCatalogItem; vi: BookCatalogItem };
    viewport: { height: number; width: number };
  },
) {
  const context = await newLanguageContext(
    browser,
    baseURL,
    options.language,
    options.viewport,
  );
  const page = await context.newPage();
  const overflowChecks: boolean[] = [];

  const home = await inspectHome(page, options.label);
  overflowChecks.push(home.hasHorizontalOverflow);
  const catalog = await inspectCatalog(page, options.label);
  overflowChecks.push(catalog.hasHorizontalOverflow);
  const detail = await inspectDetail(page, options.label, options.targets.en.slug);
  overflowChecks.push(detail.hasHorizontalOverflow);
  const cart = await inspectCart(page, options.label, options.targets);
  overflowChecks.push(cart.hasHorizontalOverflow);
  await context.close();

  return {
    cart,
    catalog,
    detail,
    home,
    noOverflow: overflowChecks.every((hasOverflow) => !hasOverflow),
    viewport: options.viewport,
  };
}

async function inspectHome(page: Page, label: string) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-home-section='hero']").waitFor();

  const root = page.locator("[data-homepage-total-editions]");
  const totalEditions = Number(
    await root.getAttribute("data-homepage-total-editions"),
  );
  const curatedEditions = Number(
    await root.getAttribute("data-homepage-curated-editions"),
  );
  const heroVisible = await page.locator("[data-home-section='hero']").isVisible();
  const categoryCards = await page.locator("[data-home-category-card]").count();
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, `home-${label}.png`),
  });

  return {
    categoryCards,
    curatedEditions,
    hasHorizontalOverflow,
    heroVisible,
    totalEditions,
  };
}

async function inspectCatalog(page: Page, label: string) {
  await page.goto("/catalog", { waitUntil: "domcontentloaded" });
  await page.locator("[data-catalog-page]").waitFor();

  const cardCount = await page.locator("[data-catalog-card]").count();
  const resultTotal = Number(
    await page
      .locator("[data-catalog-page]")
      .getAttribute("data-catalog-result-total"),
  );
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, `catalog-${label}.png`),
  });

  return {
    cardCount,
    hasHorizontalOverflow,
    resultTotal,
  };
}

async function inspectDetail(page: Page, label: string, slug: string) {
  await page.goto(`/products/${slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-detail]").waitFor();

  const visible = await page.locator("[data-book-detail]").isVisible();
  const hasPurchaseControls = await page
    .locator("[data-book-purchase-controls]")
    .isVisible();
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, `detail-${label}.png`),
  });

  return {
    hasHorizontalOverflow,
    hasPurchaseControls,
    visible,
  };
}

async function inspectCart(
  page: Page,
  label: string,
  targets: { en: BookCatalogItem; vi: BookCatalogItem },
) {
  await addEditionToCart(page, targets.en.slug);
  await addEditionToCart(page, targets.vi.slug);
  await clickCartButton(page);
  await page.locator("[data-cart-drawer-item]").first().waitFor();

  const drawerItemCount = await page.locator("[data-cart-drawer-item]").count();
  const drawerText = await page.locator("[data-cart-drawer]").innerText();
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, `cart-${label}.png`),
  });

  return {
    drawerItemCount,
    hasBookMetadata:
      /English|Vietnamese|Tiếng Anh|Tiếng Việt/.test(drawerText) &&
      /₫/.test(drawerText),
    hasHorizontalOverflow,
  };
}

async function inspectLanguageSwitch(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1440,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await clickVisibleLanguageOption(page, "vi");
  await page.waitForLoadState("networkidle");
  await page.locator("[data-home-section='hero']").waitFor();

  const bodyText = await page.locator("body").innerText();
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "language-switch-desktop-vi.png"),
  });
  await context.close();

  return {
    hasHorizontalOverflow,
    switchedToVietnamese:
      bodyText.includes("Duyệt sách") || bodyText.includes("Trang chủ"),
  };
}

async function clickVisibleLanguageOption(page: Page, language: Language) {
  const options = page.locator(`[data-language-option='${language}']`);
  const optionCount = await options.count();

  for (let index = 0; index < optionCount; index += 1) {
    const option = options.nth(index);

    if (await option.isVisible()) {
      await option.click();
      return;
    }
  }

  throw new Error(`No visible ${language} language option found`);
}

async function addEditionToCart(page: Page, slug: string) {
  await page.goto(`/products/${slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-add-to-cart-button]").click();
  await page.locator("[data-book-add-to-cart-feedback='success']").waitFor();
}

async function clickCartButton(page: Page) {
  const cartButtons = page.locator("[data-cart-drawer-open]");
  const cartButtonCount = await cartButtons.count();

  for (let index = 0; index < cartButtonCount; index += 1) {
    const button = cartButtons.nth(index);

    if (await button.isVisible()) {
      await button.click();
      return;
    }
  }

  const mobileToggle = page.locator("[data-mobile-navigation-toggle]");

  if (await mobileToggle.isVisible()) {
    await mobileToggle.click();

    for (let index = 0; index < cartButtonCount; index += 1) {
      const button = cartButtons.nth(index);

      if (await button.isVisible()) {
        await button.click();
        return;
      }
    }
  }

  throw new Error("No visible cart button found");
}

async function newLanguageContext(
  browser: Browser,
  baseURL: string,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({ baseURL, viewport });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: baseURL,
      value: language,
    },
  ]);

  return context;
}

async function hasOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("STOREFRONT_FREEZE_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
