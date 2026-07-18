import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d29-t01");

type ApiResponse<TData, TMeta = Record<string, unknown>> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: TMeta | null;
};

type BookCatalogItem = {
  id: string;
  slug: string;
  title: string;
  edition: {
    id: string;
    displayTitle: string;
    stockQuantity: number;
  };
};

type BookDetailItem = BookCatalogItem & {
  relatedEditions: BookCatalogItem[];
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.BOOK_DETAIL_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const target = await findTargetEdition(baseURL);
    const apiDetail = await inspectApiDetail(baseURL, target.slug);
    const desktop = await inspectDetailPage(browser, baseURL, {
      language: "en",
      screenshotName: "book-detail-desktop-en.png",
      slug: target.slug,
      targetEditionId: target.edition.id,
      viewport: { height: 1200, width: 1440 },
    });
    const mobile = await inspectDetailPage(browser, baseURL, {
      language: "vi",
      screenshotName: "book-detail-mobile-vi.png",
      slug: target.slug,
      targetEditionId: target.edition.id,
      viewport: { height: 1100, width: 375 },
    });
    const missing = await inspectMissingDetail(browser, baseURL);
    const pass = {
      addToCartTargetsEdition:
        desktop.cartStorageContainsTargetEdition &&
        desktop.purchaseControlsEditionId === target.edition.id,
      apiDetailValid:
        apiDetail.status === 200 &&
        apiDetail.editionId === target.edition.id &&
        apiDetail.relatedCount > 0,
      desktopDetailComplete:
        desktop.hasCover &&
        desktop.hasTitle &&
        desktop.hasAuthor &&
        desktop.hasSummary &&
        desktop.hasPrice &&
        desktop.hasStock &&
        desktop.hasEditionDetails &&
        desktop.hasCommerceHints &&
        desktop.relatedLinks > 0,
      mobileVietnameseComplete:
        mobile.hasVietnameseLabels &&
        mobile.hasEditionDetails &&
        mobile.hasCommerceHints,
      noOverflow:
        !desktop.hasHorizontalOverflow &&
        !mobile.hasHorizontalOverflow &&
        !missing.hasHorizontalOverflow,
      notFoundWorks:
        missing.status === 404 &&
        missing.hasNotFoundMarker &&
        missing.hasRecoveryLinks,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      apiDetail,
      baseURL,
      desktop,
      missing,
      mobile,
      ok,
      pass,
      target,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "book-detail-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          target: {
            editionId: target.edition.id,
            slug: target.slug,
            title: target.title,
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

async function findTargetEdition(baseURL: string) {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("limit", "1");
  url.searchParams.set("offset", "0");
  url.searchParams.set("sort", "title-asc");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Target edition lookup failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<BookCatalogItem[]>;
  const [target] = payload.data ?? [];

  if (!target) {
    throw new Error("No available book edition found for detail verification");
  }

  return target;
}

async function inspectApiDetail(baseURL: string, slug: string) {
  const response = await fetch(new URL(`/api/products/${slug}`, baseURL));
  const payload = (await response.json()) as ApiResponse<
    BookDetailItem,
    { relatedCount: number; resource: string }
  >;

  return {
    editionId: payload.data?.edition.id ?? null,
    relatedCount: payload.meta?.relatedCount ?? 0,
    resource: payload.meta?.resource ?? null,
    status: response.status,
  };
}

async function inspectDetailPage(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    screenshotName: string;
    slug: string;
    targetEditionId: string;
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

  await page.goto(`/products/${options.slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-detail]").waitFor();

  const text = await page.locator("[data-book-detail]").innerText();
  const purchaseControlsEditionId = await page
    .locator("[data-book-purchase-controls]")
    .getAttribute("data-book-purchase-controls");
  const hasHorizontalOverflow = await hasOverflow(page);
  const hasCover = await page.locator("[data-book-detail-image] img").isVisible();
  const relatedLinks = await page.locator("a[href^='/products/']").count();
  const hasVietnameseLabels =
    options.language === "vi"
      ? /Nhà xuất bản|Dịch giả|Vận chuyển|Phương thức thanh toán/.test(text)
      : true;

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, options.screenshotName),
  });

  const addToCartButton = page.locator("[data-book-add-to-cart-button]");
  await addToCartButton.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const button = document.querySelector<HTMLButtonElement>(
      "[data-book-add-to-cart-button]",
    );

    return Boolean(button && !button.disabled);
  });
  await addToCartButton.click();
  await page
    .locator("[data-book-add-to-cart-feedback='success']")
    .waitFor({ timeout: 5_000 });
  const cartStorageContainsTargetEdition = await page.evaluate(
    ({ editionId }) => {
      const rawCart = window.localStorage.getItem("caseflow-store.cart.v1");

      if (!rawCart) {
        return false;
      }

      const parsedCart = JSON.parse(rawCart) as {
        items?: { productId?: string; quantity?: number }[];
      };

      return Boolean(
        parsedCart.items?.some(
          (item) => item.productId === editionId && item.quantity === 1,
        ),
      );
    },
    { editionId: options.targetEditionId },
  );
  await context.close();

  return {
    cartStorageContainsTargetEdition,
    hasAuthor: /Author|Tác giả|Charles|Aesop|Austen|Twain|Dickens|Shelley/i.test(
      text,
    ),
    hasCommerceHints: /Payment options|Phương thức thanh toán/.test(text),
    hasCover,
    hasEditionDetails: /Publisher|Nhà xuất bản/.test(text) && /ISBN/.test(text),
    hasHorizontalOverflow,
    hasPrice: /₫/.test(text),
    hasStock: /Stock|Tồn kho|In stock|Còn hàng|Low stock|Sắp hết/.test(text),
    hasSummary: text.length > 300,
    hasTitle: /Buy this edition|Mua ấn bản này/.test(text),
    hasVietnameseLabels,
    purchaseControlsEditionId,
    relatedLinks,
    viewport: options.viewport,
  };
}

async function inspectMissingDetail(browser: Browser, baseURL: string) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 375,
  });
  const page = await context.newPage();
  const response = await page.goto("/products/not-a-real-book-edition", {
    waitUntil: "domcontentloaded",
  });

  await page.locator("[data-product-not-found]").waitFor();
  const hasNotFoundMarker = await page.locator("[data-product-not-found]").isVisible();
  const hasRecoveryLinks =
    (await page.locator("[data-product-not-found] a").count()) >= 2;
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "book-detail-not-found.png"),
  });
  await context.close();

  return {
    hasHorizontalOverflow,
    hasNotFoundMarker,
    hasRecoveryLinks,
    status: response?.status() ?? null,
  };
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
    throw new Error("BOOK_DETAIL_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
