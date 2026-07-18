import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

const ARTIFACT_DIR = path.join(".agent", "artifacts", "qa-final-t01");
const REPORT_PATH = path.join(ARTIFACT_DIR, "final-post-release-qa.json");
const SUMMARY_PATH = path.join(ARTIFACT_DIR, "final-post-release-qa.md");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const LANGUAGE_COOKIE = "caseflow-books.language";
const IMAGE_WARMUP_TIMEOUT_MS = 5_000;
const PUBLIC_LEAK_PATTERN =
  /sourceEditionKey|sourceReviewStatus|reviewerNote|rightsAnalysis|SUPABASE_SERVICE_ROLE|NEXT_PUBLIC_SUPABASE_ANON_KEY|undefined|TBC/i;

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type CatalogItem = {
  coverAsset?: {
    altText?: { en?: string; vi?: string };
    path?: string;
    source?: string;
  } | null;
  edition: {
    id: string;
    displayTitle: string;
    format: string;
    language: "en" | "vi";
    priceVnd: number;
    stockQuantity: number;
    summary?: { en?: string; vi?: string } | null;
  };
  slug: string;
  title: string;
};

type Finding = {
  area: string;
  evidence: string;
  id: string;
  recommendation: string;
  severity: "P0" | "P1" | "P2" | "P3";
  summary: string;
};

type PageCheck = {
  hasOverflow: boolean;
  label: string;
  screenshot?: string;
  status?: number;
  textLeak: boolean;
  url: string;
};

type PassMap = Record<string, boolean>;

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.FINAL_QA_BASE_URL ?? "https://caseflow-store.vercel.app",
  );
  const catalog = await fetchJson<CatalogItem[]>(
    new URL("/api/products?limit=100", baseURL),
  );
  const catalogItems = catalog.payload.data ?? [];
  const englishTarget = catalogItems.find(
    (item) => item.edition.language === "en" && item.edition.stockQuantity > 0,
  );
  const vietnameseTarget = catalogItems.find(
    (item) => item.edition.language === "vi" && item.edition.stockQuantity > 0,
  );

  if (!englishTarget || !vietnameseTarget) {
    throw new Error("Final QA requires available English and Vietnamese targets");
  }

  const browser = await chromium.launch();

  try {
    const api = await inspectApiSurface(baseURL, catalog, catalogItems);
    const browserAudit = await inspectBrowserSurface(
      browser,
      baseURL,
      englishTarget,
    );
    const findings = [
      ...createApiFindings(api),
      ...createBrowserFindings(browserAudit),
    ];
    const pass = {
      accountAndAdminBoundaries:
        browserAudit.accountBoundary && browserAudit.adminBoundary,
      assistantGuidance: browserAudit.assistant,
      catalogDiscovery:
        api.pass.catalogQuality &&
        browserAudit.catalogSearch &&
        browserAudit.catalogVietnamese,
      cartAndCheckoutBoundary:
        browserAudit.addToCart &&
        browserAudit.cartDrawer &&
        browserAudit.checkoutLoginBoundary,
      contentSafety: api.pass.publicPayloadSafe && browserAudit.publicTextSafe,
      detailAndEditionComparison: browserAudit.detail,
      noCriticalFindings: !findings.some((finding) =>
        ["P0", "P1"].includes(finding.severity),
      ),
      noOverflow: browserAudit.pageChecks.every((check) => !check.hasOverflow),
      orderTrackingStates: browserAudit.orderTracking,
      publicRoutes: api.pass.publicRoutes && browserAudit.homepage,
      statePreviews: browserAudit.statePreviews,
    } satisfies PassMap;
    const ok = Object.values(pass).every(Boolean);
    const report = {
      api,
      baseURL,
      browserAudit,
      findings,
      generatedAt: new Date().toISOString(),
      ok,
      pass,
      targets: {
        en: {
          editionId: englishTarget.edition.id,
          slug: englishTarget.slug,
          title: englishTarget.title,
        },
        vi: {
          editionId: vietnameseTarget.edition.id,
          slug: vietnameseTarget.slug,
          title: vietnameseTarget.title,
        },
      },
    };

    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(SUMMARY_PATH, createMarkdownSummary(report));
    console.log(
      JSON.stringify(
        {
          ok,
          artifact: REPORT_PATH,
          summary: SUMMARY_PATH,
          findings: findings.map(({ id, severity, summary }) => ({
            id,
            severity,
            summary,
          })),
          pass,
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

async function inspectApiSurface(
  baseURL: string,
  catalog: JsonCheck<CatalogItem[]>,
  catalogItems: CatalogItem[],
) {
  const checks = {
    account: await fetchText(new URL("/account", baseURL)),
    adminOrders: await fetchJson<unknown>(new URL("/api/admin/orders", baseURL)),
    adminShelves: await fetchJson<unknown>(
      new URL("/api/admin/merchandising/shelves", baseURL),
    ),
    catalogPage: await fetchText(new URL("/catalog", baseURL)),
    categories: await fetchJson<unknown[]>(new URL("/api/categories", baseURL)),
    customerOrders: await fetchJson<unknown>(
      new URL("/api/customer/orders", baseURL),
    ),
    home: await fetchText(new URL("/", baseURL)),
    robots: await fetchText(new URL("/robots.txt", baseURL)),
    sitemap: await fetchText(new URL("/sitemap.xml", baseURL)),
    tracking: await fetchText(new URL("/orders/track", baseURL)),
  };
  const languageCounts = catalogItems.reduce(
    (counts, item) => {
      counts[item.edition.language] += 1;
      return counts;
    },
    { en: 0, vi: 0 },
  );
  const missingCover = catalogItems.filter(
    (item) => !item.coverAsset?.path?.startsWith("/images/books/v12-covers/"),
  );
  const missingPublicCopy = catalogItems.filter((item) => {
    const summary = item.edition.summary;
    const altText = item.coverAsset?.altText;

    return !summary?.en || !summary.vi || !altText?.en || !altText.vi;
  });
  const serializedCatalog = JSON.stringify(catalog.payload);
  const pass = {
    adminBoundary:
      checks.adminOrders.status === 401 &&
      checks.adminOrders.payload.error?.code === "UNAUTHORIZED" &&
      checks.adminShelves.status === 401 &&
      checks.adminShelves.payload.error?.code === "UNAUTHORIZED",
    catalogQuality:
      catalog.status === 200 &&
      catalog.payload.error === null &&
      catalog.payload.meta?.total === 100 &&
      catalogItems.length === 100 &&
      languageCounts.en === 50 &&
      languageCounts.vi === 50 &&
      missingCover.length === 0 &&
      missingPublicCopy.length === 0,
    customerBoundary:
      checks.customerOrders.status === 401 &&
      checks.customerOrders.payload.error?.code === "UNAUTHORIZED",
    publicPayloadSafe: !PUBLIC_LEAK_PATTERN.test(serializedCatalog),
    publicRoutes:
      checks.home.status === 200 &&
      checks.catalogPage.status === 200 &&
      checks.account.status === 200 &&
      checks.tracking.status === 200 &&
      checks.robots.status === 200 &&
      checks.sitemap.status === 200 &&
      checks.categories.status === 200,
    seo:
      checks.robots.body.includes("Disallow: /admin") &&
      checks.sitemap.body.includes("/products/") &&
      !checks.sitemap.body.includes("/admin"),
  };

  return {
    failures: {
      missingCoverCount: missingCover.length,
      missingPublicCopyCount: missingPublicCopy.length,
      publicLeakPatternFound: PUBLIC_LEAK_PATTERN.test(serializedCatalog),
    },
    languageCounts,
    pass,
    status: Object.fromEntries(
      Object.entries(checks).map(([key, value]) => [key, value.status]),
    ),
    total: catalog.payload.meta?.total ?? null,
  };
}

async function inspectBrowserSurface(
  browser: Browser,
  baseURL: string,
  englishTarget: CatalogItem,
) {
  const pageChecks: PageCheck[] = [];
  const screenshots: Record<string, string> = {};
  const desktopEn = await newLanguagePage(browser, baseURL, "en", {
    height: 940,
    width: 1440,
  });
  const mobileVi = await newLanguagePage(browser, baseURL, "vi", {
    height: 860,
    width: 390,
  });
  const mobileEn = await newLanguagePage(browser, baseURL, "en", {
    height: 860,
    width: 390,
  });

  try {
    const homepage = await inspectHomepage(desktopEn, pageChecks, screenshots);
    const assistant = await inspectAssistant(desktopEn);
    const catalogSearch = await inspectCatalogSearch(
      desktopEn,
      englishTarget,
      pageChecks,
      screenshots,
    );
    const catalogVietnamese = await inspectVietnameseCatalog(
      mobileVi,
      pageChecks,
      screenshots,
    );
    const detail = await inspectDetail(
      desktopEn,
      englishTarget,
      pageChecks,
      screenshots,
    );
    const addToCart = await inspectAddToCart(desktopEn);
    const cartDrawer = await inspectCartDrawer(desktopEn);
    const checkoutLoginBoundary = await inspectCheckoutBoundary(
      mobileEn,
      englishTarget.edition.id,
      pageChecks,
      screenshots,
    );
    const orderTracking = await inspectOrderTracking(
      mobileVi,
      pageChecks,
      screenshots,
    );
    const accountBoundary = await inspectAccountBoundary(
      mobileEn,
      pageChecks,
      screenshots,
    );
    const adminBoundary = await inspectAdminBoundary(
      mobileEn,
      pageChecks,
      screenshots,
    );
    const statePreviews = await inspectStatePreviews(
      desktopEn,
      pageChecks,
      screenshots,
    );
    const publicTextSafe = pageChecks.every((check) => !check.textLeak);

    return {
      accountBoundary,
      addToCart,
      adminBoundary,
      assistant,
      cartDrawer,
      catalogSearch,
      catalogVietnamese,
      checkoutLoginBoundary,
      detail,
      homepage,
      orderTracking,
      pageChecks,
      publicTextSafe,
      screenshots,
      statePreviews,
    };
  } finally {
    await Promise.all([
      desktopEn.context().close(),
      mobileVi.context().close(),
      mobileEn.context().close(),
    ]);
  }
}

async function inspectHomepage(
  page: Page,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
  const screenshot = await capture(page, "qa-home-desktop-en.png", screenshots);
  pageChecks.push(await checkPage(page, "home desktop en", screenshot));
  const bodyText = await page.locator("body").innerText();

  return (
    bodyText.includes("CaseFlow Books") &&
    (await page.locator("[data-book-assistant-toggle]").isVisible()) &&
    (await page.locator("[data-cart-drawer-open]").first().isVisible())
  );
}

async function inspectAssistant(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await click(page, "[data-book-assistant-toggle]");
  await page.locator("[data-book-assistant-panel]").waitFor({ state: "visible" });
  await page.locator("[data-book-assistant-input]").fill("gatsby english");
  await click(page, "[data-book-assistant-send]");
  await page
    .locator("[data-book-assistant-loading]")
    .waitFor({ state: "detached", timeout: 20_000 })
    .catch(() => undefined);
  await page
    .locator("[data-book-assistant-result-link]")
    .first()
    .waitFor({ state: "visible", timeout: 20_000 });
  const href = await page
    .locator("[data-book-assistant-result-link]")
    .first()
    .getAttribute("href");

  return typeof href === "string" && href.startsWith("/products/");
}

async function inspectCatalogSearch(
  page: Page,
  target: CatalogItem,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  const query = getCatalogSearchToken(target);

  await page.goto(`/catalog?q=${encodeURIComponent(query)}&language=en&sort=title-asc`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-catalog-page]").waitFor({ state: "visible" });
  const screenshot = await capture(
    page,
    "qa-catalog-search-desktop-en.png",
    screenshots,
  );
  pageChecks.push(await checkPage(page, "catalog search desktop en", screenshot));
  const cardCount = await page.locator("[data-catalog-card]").count();
  const resultTotal = Number(
    await page.locator("[data-catalog-page]").getAttribute("data-catalog-result-total"),
  );
  const text = await page.locator("[data-catalog-page]").innerText();

  return cardCount > 0 && resultTotal > 0 && text.includes(target.title);
}

async function inspectVietnameseCatalog(
  page: Page,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  await page.goto("/catalog?language=vi&page=2", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-catalog-page]").waitFor({ state: "visible" });
  const screenshot = await capture(
    page,
    "qa-catalog-mobile-vi-page-2.png",
    screenshots,
  );
  pageChecks.push(await checkPage(page, "catalog mobile vi", screenshot));
  const text = await page.locator("[data-catalog-page]").innerText();
  const renderedCount = Number(
    await page.locator("[data-catalog-page]").getAttribute("data-catalog-rendered-count"),
  );
  const totalCount = Number(
    await page.locator("[data-catalog-page]").getAttribute("data-catalog-total-count"),
  );

  return /Danh mục|Tiếng Việt|Sách/i.test(text) && renderedCount > 0 && totalCount === 100;
}

async function inspectDetail(
  page: Page,
  target: CatalogItem,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  await page.goto(`/products/${target.slug}`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-book-detail]").waitFor({ state: "visible" });
  const screenshot = await capture(page, "qa-detail-desktop-en.png", screenshots);
  pageChecks.push(await checkPage(page, "detail desktop en", screenshot));

  return (
    (await page.locator("[data-book-detail-image] img").isVisible()) &&
    (await page.locator("[data-book-detail-price]").isVisible()) &&
    (await page.locator("[data-book-edition-comparison]").isVisible()) &&
    (await page.locator("[data-book-add-to-cart-button]").isVisible()) &&
    (await page.locator("[data-book-detail]").innerText()).includes(
      target.edition.displayTitle,
    )
  );
}

async function inspectAddToCart(page: Page) {
  await click(page, "[data-book-add-to-cart-button]");
  await page
    .locator("[data-book-add-to-cart-feedback]")
    .waitFor({ state: "visible", timeout: 10_000 });
  const cartCount = await page
    .locator("[data-cart-count]")
    .first()
    .getAttribute("data-cart-count");

  return cartCount === "1";
}

async function inspectCartDrawer(page: Page) {
  await click(page, "[data-cart-drawer-open]");
  await page.locator("[data-cart-drawer]").waitFor({ state: "visible" });
  await page.locator("[data-cart-drawer-item]").first().waitFor({
    state: "visible",
    timeout: 20_000,
  });

  return (
    (await page.locator("[data-cart-drawer-item]").count()) > 0 &&
    (await page.locator("[data-cart-drawer-subtotal]").isVisible()) &&
    (await page.locator("[data-cart-drawer-checkout]").isVisible())
  );
}

async function inspectCheckoutBoundary(
  page: Page,
  editionId: string,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ cartKey, productId }) => {
      window.localStorage.setItem(
        cartKey,
        JSON.stringify({ items: [{ productId, quantity: 1 }], version: 1 }),
      );
    },
    { cartKey: CART_STORAGE_KEY, productId: editionId },
  );
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
  const screenshot = await capture(
    page,
    "qa-checkout-boundary-mobile-en.png",
    screenshots,
  );
  pageChecks.push(await checkPage(page, "checkout boundary mobile en", screenshot));

  return /\/account\?next=%2Fcheckout|\/account\?next=\/checkout/.test(
    page.url(),
  );
}

async function inspectOrderTracking(
  page: Page,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  await page.goto("/orders/track", { waitUntil: "domcontentloaded" });
  await page.locator("[data-order-tracking-page]").waitFor({ state: "visible" });
  await page.locator("[data-order-tracking-code]").fill("CF-MISSING-ORDER-0001");
  await page.locator("[data-order-tracking-contact]").fill("wrong@example.com");
  await click(page, "[data-order-tracking-submit]");
  await page
    .locator("[data-order-tracking-error]")
    .waitFor({ state: "visible", timeout: 15_000 });
  const screenshot = await capture(
    page,
    "qa-order-tracking-error-mobile-vi.png",
    screenshots,
  );
  pageChecks.push(await checkPage(page, "order tracking error mobile vi", screenshot));
  const text = await page.locator("[data-order-tracking-page]").innerText();

  return /Không tìm thấy|Tra cứu|đơn hàng/i.test(text);
}

async function inspectAccountBoundary(
  page: Page,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("main").waitFor({ state: "visible" });
  const screenshot = await capture(page, "qa-account-mobile-en.png", screenshots);
  pageChecks.push(await checkPage(page, "account mobile en", screenshot));
  const text = await page.locator("main").innerText();

  return /Account|Sign in|Create account/i.test(text);
}

async function inspectAdminBoundary(
  page: Page,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  await page.goto("/admin/orders", { waitUntil: "domcontentloaded" });
  await page
    .locator("[data-admin-login-page]")
    .waitFor({ state: "visible", timeout: 20_000 });
  const screenshot = await capture(page, "qa-admin-boundary-mobile-en.png", screenshots);
  pageChecks.push(await checkPage(page, "admin boundary mobile en", screenshot));

  return /\/admin\/login\?reason=unauthorized/.test(page.url());
}

async function inspectStatePreviews(
  page: Page,
  pageChecks: PageCheck[],
  screenshots: Record<string, string>,
) {
  const states = [
    ["loading", "[data-book-catalog-loading-state]"],
    ["empty", "[data-book-catalog-empty-state]"],
    ["error", "[data-book-catalog-error-state]"],
  ] as const;
  const results: boolean[] = [];

  for (const [state, selector] of states) {
    await page.goto(`/catalog-state-preview?state=${state}`, {
      waitUntil: "domcontentloaded",
    });
    await page
      .locator("[data-book-catalog-state-preview]")
      .waitFor({ state: "visible" });
    await page.locator(selector).waitFor({ state: "visible" });
    const screenshot = await capture(
      page,
      `qa-catalog-state-preview-${state}.png`,
      screenshots,
    );
    pageChecks.push(
      await checkPage(page, `catalog state preview ${state}`, screenshot),
    );
    results.push(await page.locator(selector).isVisible());
  }

  return results.every(Boolean);
}

async function checkPage(
  page: Page,
  label: string,
  screenshot?: string,
): Promise<PageCheck> {
  const bodyText = await page.locator("body").innerText();
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
  });

  return {
    hasOverflow,
    label,
    screenshot,
    textLeak: PUBLIC_LEAK_PATTERN.test(bodyText),
    url: page.url(),
  };
}

function getCatalogSearchToken(target: CatalogItem) {
  const stopWords = new Set(["and", "the", "with"]);
  const token = target.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .find((part) => part.length >= 3 && !stopWords.has(part));

  return token ?? target.slug.split("-")[0] ?? "book";
}

async function newLanguagePage(
  browser: Browser,
  baseURL: string,
  language: "en" | "vi",
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL,
    isMobile: viewport.width < 600,
    viewport,
  });
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: baseURL,
      value: language,
    },
  ]);

  return context.newPage();
}

async function click(page: Page, selector: string) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: "visible" });
  await target.evaluate((element) => {
    (element as HTMLElement).click();
  });
}

async function capture(
  page: Page,
  filename: string,
  screenshots: Record<string, string>,
) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 240);
    const maxY = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );

    for (let y = 0; y < maxY; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 120));
  });
  await page.evaluate(async () => {
    const imagePromises = Array.from(document.images).map(async (image) => {
      if (image.complete) {
        return;
      }

      await new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    });

    await Promise.race([
      Promise.all(imagePromises),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
  });
  const targetPath = path.join(ARTIFACT_DIR, filename);
  screenshots[filename] = targetPath;
  await page.screenshot({
    fullPage: true,
    path: targetPath,
    timeout: IMAGE_WARMUP_TIMEOUT_MS * 6,
  });

  return targetPath;
}

function createApiFindings(api: Awaited<ReturnType<typeof inspectApiSurface>>) {
  const findings: Finding[] = [];

  if (!api.pass.publicRoutes) {
    findings.push({
      area: "Public routes",
      evidence: `Statuses: ${JSON.stringify(api.status)}`,
      id: "QA-PUBLIC-ROUTES",
      recommendation: "Fix failed public route or API status before accepting QA.",
      severity: "P1",
      summary: "One or more public routes/APIs did not return the expected status.",
    });
  }

  if (!api.pass.catalogQuality) {
    findings.push({
      area: "Catalog",
      evidence: `Total ${api.total}, languageCounts ${JSON.stringify(
        api.languageCounts,
      )}, failures ${JSON.stringify(api.failures)}`,
      id: "QA-CATALOG-QUALITY",
      recommendation:
        "Restore 100-edition catalog quality, bilingual copy, and cover coverage.",
      severity: "P1",
      summary: "Catalog quality fell below the v1.3 release baseline.",
    });
  }

  if (!api.pass.adminBoundary || !api.pass.customerBoundary) {
    findings.push({
      area: "Access control",
      evidence: `Statuses: ${JSON.stringify(api.status)}`,
      id: "QA-ACCESS-BOUNDARY",
      recommendation: "Inspect server-side auth/role guards for protected APIs.",
      severity: "P1",
      summary: "Protected customer/admin API boundary did not behave as expected.",
    });
  }

  if (!api.pass.publicPayloadSafe) {
    findings.push({
      area: "Content safety",
      evidence: "Public catalog payload matched the private/debug leak pattern.",
      id: "QA-PUBLIC-PAYLOAD-LEAK",
      recommendation:
        "Remove private source-review/debug fields from public serialization.",
      severity: "P1",
      summary: "Public API payload appears to expose private/debug content.",
    });
  }

  return findings;
}

function createBrowserFindings(
  browserAudit: Awaited<ReturnType<typeof inspectBrowserSurface>>,
) {
  const findings: Finding[] = [];
  const browserPasses: Array<[string, boolean, string]> = [
    ["QA-HOMEPAGE", browserAudit.homepage, "Homepage primary UI did not load correctly."],
    ["QA-ASSISTANT", browserAudit.assistant, "Assistant did not return a product result."],
    ["QA-CATALOG-SEARCH", browserAudit.catalogSearch, "Catalog search did not return expected results."],
    ["QA-CATALOG-VI", browserAudit.catalogVietnamese, "Vietnamese catalog view failed."],
    ["QA-DETAIL", browserAudit.detail, "Book detail hierarchy or purchase controls failed."],
    ["QA-CART", browserAudit.addToCart && browserAudit.cartDrawer, "Cart add/drawer flow failed."],
    ["QA-CHECKOUT-BOUNDARY", browserAudit.checkoutLoginBoundary, "Checkout did not enforce account boundary."],
    ["QA-ORDER-TRACKING", browserAudit.orderTracking, "Order tracking error/empty state failed."],
    ["QA-ACCOUNT", browserAudit.accountBoundary, "Account boundary page failed."],
    ["QA-ADMIN", browserAudit.adminBoundary, "Admin unauthorized boundary failed."],
    ["QA-STATES", browserAudit.statePreviews, "Catalog loading/empty/error states failed."],
  ];

  for (const [id, pass, summary] of browserPasses) {
    if (!pass) {
      findings.push({
        area: "Browser UX",
        evidence: `Check ${id} returned false.`,
        id,
        recommendation: "Reproduce with the QA screenshot artifact and fix the affected flow.",
        severity: "P1",
        summary,
      });
    }
  }

  const overflowPages = browserAudit.pageChecks.filter((check) => check.hasOverflow);

  if (overflowPages.length > 0) {
    findings.push({
      area: "Responsive layout",
      evidence: overflowPages.map((check) => `${check.label}: ${check.url}`).join("; "),
      id: "QA-RESPONSIVE-OVERFLOW",
      recommendation: "Fix horizontal overflow at the reported viewport/page.",
      severity: "P1",
      summary: "One or more audited pages has horizontal overflow.",
    });
  }

  const textLeakPages = browserAudit.pageChecks.filter((check) => check.textLeak);

  if (textLeakPages.length > 0) {
    findings.push({
      area: "Public UI copy",
      evidence: textLeakPages.map((check) => `${check.label}: ${check.url}`).join("; "),
      id: "QA-PUBLIC-TEXT-LEAK",
      recommendation: "Remove debug/private/placeholder text from public UI.",
      severity: "P1",
      summary: "One or more audited pages contains debug/private/placeholder text.",
    });
  }

  return findings;
}

function createMarkdownSummary(report: {
  api: Awaited<ReturnType<typeof inspectApiSurface>>;
  baseURL: string;
  browserAudit: Awaited<ReturnType<typeof inspectBrowserSurface>>;
  findings: Finding[];
  generatedAt: string;
  ok: boolean;
  pass: PassMap;
  targets: Record<string, { editionId: string; slug: string; title: string }>;
}) {
  const passRows = Object.entries(report.pass)
    .map(([key, value]) => `| ${key} | ${value ? "pass" : "fail"} |`)
    .join("\n");
  const findingRows =
    report.findings.length > 0
      ? report.findings
          .map(
            (finding) =>
              `| ${finding.id} | ${finding.severity} | ${finding.area} | ${finding.summary} |`,
          )
          .join("\n")
      : "| none | none | none | No P0/P1 findings from automated QA audit. |";

  return `# Final Post-Release QA Audit

- Task: QA-FINAL-T01
- Generated: ${report.generatedAt}
- Base URL: ${report.baseURL}
- Overall result: ${report.ok ? "pass" : "fail"}

## Pass Matrix

| Area | Result |
|---|---|
${passRows}

## Findings

| ID | Severity | Area | Summary |
|---|---|---|---|
${findingRows}

## Catalog Baseline

- Total editions: ${report.api.total}
- English editions: ${report.api.languageCounts.en}
- Vietnamese editions: ${report.api.languageCounts.vi}
- English target: ${report.targets.en.slug}
- Vietnamese target: ${report.targets.vi.slug}

## Screenshot Evidence

${Object.values(report.browserAudit.screenshots)
  .map((screenshot) => `- ${screenshot}`)
  .join("\n")}
`;
}

type JsonCheck<TData> = {
  payload: ApiResponse<TData>;
  status: number;
};

async function fetchText(url: URL) {
  const response = await fetch(url);

  return {
    body: await response.text(),
    status: response.status,
  };
}

async function fetchJson<TData>(url: URL): Promise<JsonCheck<TData>> {
  const response = await fetch(url);

  return {
    payload: (await response.json()) as ApiResponse<TData>,
    status: response.status,
  };
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("FINAL_QA_BASE_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
