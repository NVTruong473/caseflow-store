import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d30-t01");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type BookCatalogItem = {
  id: string;
  slug: string;
  title: string;
  edition: {
    id: string;
    language: "en" | "vi";
    stockQuantity: number;
  };
};

type CartValidationData = {
  currency: "VND";
  items: {
    availableStock: number;
    editionId: string;
    lineTotal: number;
    product: {
      format: string;
      id: string;
      language: "en" | "vi";
      name: string;
      price: number;
      stock: number;
    };
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.BOOK_CART_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();

  try {
    const targets = {
      en: await findTargetEdition(baseURL, "en"),
      vi: await findTargetEdition(baseURL, "vi"),
    };
    const desktop = await inspectCartDrawer(browser, baseURL, {
      language: "en",
      screenshotName: "book-cart-desktop-en.png",
      targets,
      viewport: { height: 1100, width: 1440 },
    });
    const mobile = await inspectCartDrawer(browser, baseURL, {
      language: "vi",
      screenshotName: "book-cart-mobile-vi.png",
      targets,
      viewport: { height: 900, width: 375 },
    });
    const apiValidation = await inspectApiValidation(baseURL, targets);
    const tamperedStorage = await inspectTamperedStorage(
      browser,
      baseURL,
      targets.en,
    );
    const pass = {
      apiIgnoresClientTotals:
        apiValidation.status === 200 &&
        apiValidation.subtotalMatchesLines &&
        apiValidation.fakeClientFieldsIgnored,
      cartDisplaysBookEditionMetadata:
        desktop.hasBookMetadata && mobile.hasBookMetadata,
      localStorageStoresOnlyIdAndQuantity:
        desktop.localStorageShapeOk && mobile.localStorageShapeOk,
      noOverflow:
        !desktop.hasHorizontalOverflow &&
        !mobile.hasHorizontalOverflow &&
        !tamperedStorage.hasHorizontalOverflow,
      tamperedStorageSafeRecovery:
        tamperedStorage.hasValidationError &&
        tamperedStorage.hasRecoveryActions &&
        tamperedStorage.fakeClientTextAbsent,
      twoEditionsAdded:
        desktop.drawerItemCount === 2 &&
        mobile.drawerItemCount === 2 &&
        desktop.cartCount === 2 &&
        mobile.cartCount === 2,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      apiValidation,
      baseURL,
      desktop,
      mobile,
      ok,
      pass,
      tamperedStorage,
      targets,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "book-cart-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          targets: {
            en: { editionId: targets.en.edition.id, slug: targets.en.slug },
            vi: { editionId: targets.vi.edition.id, slug: targets.vi.slug },
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
    throw new Error(`No available ${language} book edition found`);
  }

  return target;
}

async function inspectCartDrawer(
  browser: Browser,
  baseURL: string,
  options: {
    language: Language;
    screenshotName: string;
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

  await addEditionToCart(page, options.targets.en.slug);
  await addEditionToCart(page, options.targets.vi.slug);
  const cartCount = await clickCartButton(page);
  await page.locator("[data-cart-drawer-item]").first().waitFor();

  const drawerText = await page.locator("[data-cart-drawer]").innerText();
  const drawerItemCount = await page.locator("[data-cart-drawer-item]").count();
  const localStorageShape = await readCartStorageShape(page);
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, options.screenshotName),
  });
  await context.close();

  return {
    cartCount,
    drawerItemCount,
    hasBookMetadata:
      /English|Vietnamese|Tiếng Anh|Tiếng Việt/.test(drawerText) &&
      /Paperback|Hardcover|Bìa mềm|Bìa cứng|Special edition|Ấn bản đặc biệt/.test(
        drawerText,
      ) &&
      /₫/.test(drawerText),
    hasHorizontalOverflow,
    localStorageShape,
    localStorageShapeOk: localStorageShape.ok,
    viewport: options.viewport,
  };
}

async function addEditionToCart(page: Page, slug: string) {
  await page.goto(`/products/${slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-add-to-cart-button]").click();
  await page.locator("[data-book-add-to-cart-feedback='success']").waitFor();
}

async function inspectApiValidation(
  baseURL: string,
  targets: { en: BookCatalogItem; vi: BookCatalogItem },
) {
  const response = await fetch(new URL("/api/cart/validate", baseURL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          lineTotal: 1,
          price: 1,
          productId: targets.en.edition.id,
          productName: "Fake hacked title",
          quantity: 2,
          stock: 9999,
        },
        {
          productId: targets.vi.edition.id,
          quantity: 1,
          unitPrice: 1,
        },
      ],
      subtotal: 3,
    }),
  });
  const payload = (await response.json()) as ApiResponse<CartValidationData>;
  const items = payload.data?.items ?? [];
  const calculatedSubtotal = items.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const responseText = JSON.stringify(payload);

  return {
    fakeClientFieldsIgnored:
      !responseText.includes("Fake hacked title") &&
      items.every((line) => line.unitPrice > 1 && line.product.price > 1),
    returnedEditions: items.map((line) => ({
      editionId: line.editionId,
      language: line.product.language,
      lineTotal: line.lineTotal,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
    status: response.status,
    subtotal: payload.data?.subtotal ?? null,
    subtotalMatchesLines: payload.data?.subtotal === calculatedSubtotal,
  };
}

async function inspectTamperedStorage(
  browser: Browser,
  baseURL: string,
  target: BookCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 390,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ editionId }) => {
      window.localStorage.setItem(
        "caseflow-store.cart.v1",
        JSON.stringify({
          items: [
            {
              lineTotal: 1,
              price: 1,
              productId: editionId,
              productName: "Fake hacked title",
              quantity: 999,
              stock: 9999,
            },
          ],
          subtotal: 1,
          version: 1,
        }),
      );
    },
    { editionId: target.edition.id },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await clickCartButton(page);
  await page.locator("[data-cart-drawer-error]").waitFor();

  const drawerText = await page.locator("[data-cart-drawer]").innerText();
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "book-cart-tampered-storage.png"),
  });
  await context.close();

  return {
    fakeClientTextAbsent: !drawerText.includes("Fake hacked title"),
    hasHorizontalOverflow,
    hasRecoveryActions: /Continue shopping|Clear cart/.test(drawerText),
    hasValidationError:
      /Requested quantity exceeds available stock|Invalid cart payload/.test(
        drawerText,
      ),
  };
}

async function readCartStorageShape(page: Page) {
  return page.evaluate((storageKey) => {
    const rawCart = window.localStorage.getItem(storageKey);

    if (!rawCart) {
      return { ok: false, reason: "missing cart storage" };
    }

    const parsedCart = JSON.parse(rawCart) as {
      items?: Record<string, unknown>[];
      version?: unknown;
    };
    const rootKeys = Object.keys(parsedCart).sort();
    const itemKeys = parsedCart.items?.map((item) => Object.keys(item).sort()) ?? [];
    const ok =
      rootKeys.join(",") === "items,version" &&
      itemKeys.length === 2 &&
      itemKeys.every((keys) => keys.join(",") === "productId,quantity");

    return {
      itemKeys,
      ok,
      rootKeys,
    };
  }, CART_STORAGE_KEY);
}

async function clickCartButton(page: Page) {
  const cartButtons = page.locator("[data-cart-drawer-open]");
  const cartButtonCount = await cartButtons.count();

  for (let index = 0; index < cartButtonCount; index += 1) {
    const button = cartButtons.nth(index);

    if (await button.isVisible()) {
      const cartCount = Number(await button.getAttribute("data-cart-count"));
      await button.click();
      return cartCount;
    }
  }

  const mobileToggle = page.locator("[data-mobile-navigation-toggle]");

  if (await mobileToggle.isVisible()) {
    await mobileToggle.click();

    for (let index = 0; index < cartButtonCount; index += 1) {
      const button = cartButtons.nth(index);

      if (await button.isVisible()) {
        const cartCount = Number(await button.getAttribute("data-cart-count"));
        await button.click();
        return cartCount;
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
    throw new Error("BOOK_CART_VERIFY_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main();
