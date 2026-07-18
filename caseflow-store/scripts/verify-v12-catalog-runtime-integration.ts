import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseOrdersCsvExport } from "../src/lib/repositories/supabase-order-exports";
import { listSupabaseOrdersForCustomer } from "../src/lib/repositories/supabase-orders";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { BookFormat } from "../src/types/domain";
import type { Json } from "../src/types/supabase";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "v12-t16");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const QA_DATE = "2099-03-16";
const TEST_PASSWORD = "CaseflowBooks#V12T16";
const LEGACY_SNAPSHOT_TITLE = "Legacy v1.1 Snapshot Line";
const FORBIDDEN_PUBLIC_FIELDS =
  /sourceEditionKey|sourceReviewStatus|source_edition_key|source_review_status|reviewer_note|rights_analysis/i;
const UNSUPPORTED_PUBLIC_COPY =
  /\b(?:\d+(?:\.\d)?\/5|sold|đã bán|bestseller|best seller|xếp hạng|same-day|giao trong 2h|giao hôm nay)\b/i;
const STALE_DOC_PATTERNS = [
  /runtime catalog still (?:uses|points at) the v1\.1 placeholder/i,
  /accepted cover\/editorial\/merchandising portfolio is not yet migrated/i,
  /v1\.2 manifest is not yet the runtime catalog source/i,
  /Storefront layout and admin workflows still need v1\.2 presentation\/operations upgrades/i,
  /active cover strategy uses an internal placeholder SVG/i,
];

type ApiResponse<TData, TMeta = Record<string, unknown>> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: TMeta | null;
};

type LocalizedText = {
  en: string;
  vi: string;
};

type PublicCatalogItem = {
  id: string;
  slug: string;
  title: string;
  edition: {
    displayFacts: Array<{
      key: string;
      label: LocalizedText;
      provenanceRecordId: string;
      value: LocalizedText;
    }>;
    displayTitle: string;
    format: BookFormat;
    id: string;
    inventoryStatus: string;
    isbn13: string | null;
    language: "en" | "vi";
    pairedEditionId: string | null;
    priceVnd: number;
    reasonToRead: LocalizedText | null;
    stockQuantity: number;
  };
  work: {
    id: string;
    title: string;
  };
  authors: Array<{ name: string }>;
  publisher: { name: string } | null;
  coverAsset: {
    altText: Partial<LocalizedText>;
    path: string;
    source: string;
  } | null;
};

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.V12_CATALOG_INTEGRATION_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const catalogInspection = await inspectPublicCatalog(baseURL);
  const browser = await chromium.launch();

  try {
    const [assistant, seo, checkoutGate] = await Promise.all([
      inspectAssistant(browser, baseURL, catalogInspection.target),
      inspectSeoAndSitemap(browser, baseURL, catalogInspection.target),
      inspectCheckoutGate(browser, baseURL, catalogInspection.target),
    ]);
    const [cart, orderAndExport, legacyLinks, docs] = await Promise.all([
      inspectCartValidation(baseURL, catalogInspection.target),
      inspectOrderAndExportSnapshots(catalogInspection.target),
      inspectLegacyLinks(baseURL),
      inspectDocs(),
    ]);
    const pass = {
      assistant:
        assistant.resultVisible &&
        assistant.resultLinksValid &&
        !assistant.hasForbiddenPublicFields &&
        !assistant.hasUnsupportedClaims,
      cart:
        cart.status === 200 &&
        cart.serverSnapshotUsesTarget &&
        cart.coverUsesV12Asset &&
        cart.fakeClientFieldsIgnored &&
        !cart.hasForbiddenPublicFields,
      checkoutGate:
        checkoutGate.redirectedToAccount &&
        checkoutGate.cartStorageShapeOk,
      docs: docs.noBrokenMarkdownLinks && docs.noStaleClaims,
      legacyLinks:
        legacyLinks.compatibilityRows >= 3 &&
        legacyLinks.retiredSlugs.every(
          (item) => item.status === 404 && item.hasCatalogRecoveryLink,
        ),
      orderAndExport:
        orderAndExport.orderHistoryHasBookSnapshot &&
        orderAndExport.orderHistoryHasLegacySnapshot &&
        orderAndExport.csvHasBookSnapshot &&
        orderAndExport.csvHasLegacySnapshot &&
        orderAndExport.csvSensitiveFieldsExcluded &&
        orderAndExport.cleanup.ordersRemoved >= 1 &&
        orderAndExport.cleanup.userDeleted,
      publicCatalog:
        catalogInspection.total === 100 &&
        catalogInspection.hasV12Cover &&
        catalogInspection.reasonSearchFindsTarget &&
        catalogInspection.publisherSearchFindsTarget &&
        catalogInspection.detailApiLinkValid &&
        !catalogInspection.hasForbiddenPublicFields,
      seo:
        seo.productStatus === 200 &&
        seo.ogImageUsesCover &&
        seo.twitterImageUsesCover &&
        seo.structuredDataUsesCover &&
        seo.structuredDataOfferUrlMatchesCanonical &&
        seo.sitemapIncludesTarget &&
        seo.sitemapProductCount >= 100 &&
        !seo.hasForbiddenPublicFields,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      assistant,
      baseURL,
      cart,
      catalog: catalogInspection,
      checkoutGate,
      docs,
      generatedAt: new Date().toISOString(),
      legacyLinks,
      ok,
      orderAndExport,
      pass,
      seo,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "catalog-runtime-integration-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          target: catalogInspection.target.slug,
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

async function inspectPublicCatalog(baseURL: string) {
  const catalogPayload = await fetchCatalog(baseURL, {
    limit: "100",
    sort: "title-asc",
  });
  const catalog = catalogPayload.data ?? [];
  const target = required(
    catalog.find(
      (item) =>
        item.coverAsset?.path.includes("/images/books/v12-covers/") &&
        item.edition.reasonToRead &&
        item.edition.displayFacts.length > 0 &&
        item.edition.isbn13 &&
        item.edition.pairedEditionId &&
        item.edition.inventoryStatus !== "out-of-stock" &&
        item.edition.inventoryStatus !== "discontinued" &&
        item.edition.stockQuantity > 0 &&
        item.publisher,
    ),
    "No v1.2 catalog target with cover, facts, ISBN, pair, stock, and publisher",
  );
  const reasonProbe = createSearchProbe(
    target.edition.reasonToRead?.vi ?? target.edition.reasonToRead?.en ?? "",
  );
  const publisherProbe = target.publisher?.name ?? "";
  const reasonResults = await fetchCatalog(baseURL, {
    limit: "100",
    q: reasonProbe,
    sort: "title-asc",
  });
  const publisherResults = await fetchCatalog(baseURL, {
    limit: "100",
    q: publisherProbe,
    sort: "title-asc",
  });
  const detailResponse = await fetch(new URL(`/api/products/${target.slug}`, baseURL));
  const detailText = await detailResponse.text();
  const publicPayloadText = JSON.stringify({
    catalog: catalogPayload.data,
    detail: detailText,
  });
  const localCoverExists = fs.existsSync(
    path.join("public", target.coverAsset?.path ?? ""),
  );

  return {
    detailApiLinkValid: detailResponse.status === 200,
    hasForbiddenPublicFields: FORBIDDEN_PUBLIC_FIELDS.test(publicPayloadText),
    hasV12Cover: Boolean(
      target.coverAsset?.path.includes("/images/books/v12-covers/") &&
        localCoverExists,
    ),
    publisherSearchFindsTarget: (publisherResults.data ?? []).some(
      (item) => item.slug === target.slug,
    ),
    reasonProbe,
    reasonSearchFindsTarget: (reasonResults.data ?? []).some(
      (item) => item.slug === target.slug,
    ),
    target,
    total: catalogPayload.meta?.total ?? catalog.length,
  };
}

async function inspectAssistant(
  browser: Browser,
  baseURL: string,
  target: PublicCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 1280,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document
      .querySelector<HTMLButtonElement>("[data-book-assistant-toggle]")
      ?.click();
  });
  await page.locator("[data-book-assistant-input]").waitFor({
    timeout: 20_000,
  });
  await page
    .locator("[data-book-assistant-input]")
    .fill(`Find "${target.edition.displayTitle}"`);
  await page.evaluate(() => {
    document
      .querySelector<HTMLButtonElement>("[data-book-assistant-send]")
      ?.click();
  });
  const targetLink = page.locator(
    `[data-book-assistant-result-link='${target.slug}']`,
  );

  await targetLink.waitFor({ timeout: 20_000 });
  const assistantText = await page.locator("[data-book-assistant-panel]").innerText();
  const resultHrefs = await page
    .locator("[data-book-assistant-result-link]")
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href)),
    );
  const linkStatuses = await Promise.all(
    resultHrefs.map(async (href) => {
      const response = await page.request.get(href);

      return { href, status: response.status() };
    }),
  );
  const resultVisible = await targetLink.isVisible();

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "assistant-result-desktop-en.png"),
  });
  await context.close();

  return {
    hasForbiddenPublicFields: FORBIDDEN_PUBLIC_FIELDS.test(assistantText),
    hasUnsupportedClaims: UNSUPPORTED_PUBLIC_COPY.test(assistantText),
    linkStatuses,
    resultLinksValid:
      linkStatuses.length > 0 &&
      linkStatuses.every((item) => item.status === 200),
    resultVisible,
  };
}

async function inspectSeoAndSitemap(
  browser: Browser,
  baseURL: string,
  target: PublicCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1000,
    width: 1280,
  });
  const page = await context.newPage();
  const response = await page.goto(`/products/${target.slug}`, {
    waitUntil: "domcontentloaded",
  });
  const head = await page.locator("head").innerHTML();
  const rawStructuredData =
    (await page.evaluate(
      () =>
        document.querySelector<HTMLScriptElement>(
          "script[type='application/ld+json']",
        )?.textContent ?? "{}",
    )) ?? "{}";
  const structuredData = JSON.parse(rawStructuredData) as {
    image?: string;
    offers?: { url?: string };
  };
  const metadata = await page.evaluate(() => ({
    canonical:
      document
        .querySelector<HTMLLinkElement>("link[rel='canonical']")
        ?.getAttribute("href") ?? "",
    ogImage:
      document
        .querySelector<HTMLMetaElement>("meta[property='og:image']")
        ?.getAttribute("content") ?? "",
    twitterImage:
      document
        .querySelector<HTMLMetaElement>("meta[name='twitter:image']")
        ?.getAttribute("content") ?? "",
  }));

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "seo-detail-desktop-en.png"),
  });
  await context.close();

  const sitemapResponse = await fetch(new URL("/sitemap.xml", baseURL));
  const sitemapBody = await sitemapResponse.text();
  const productLocCount = Array.from(
    sitemapBody.matchAll(/<loc>[^<]+\/products\/[^<]+<\/loc>/g),
  ).length;
  const coverPath = target.coverAsset?.path ?? "";

  return {
    hasForbiddenPublicFields: FORBIDDEN_PUBLIC_FIELDS.test(
      `${head}\n${rawStructuredData}`,
    ),
    metadata,
    ogImageUsesCover: metadata.ogImage.includes(coverPath),
    productStatus: response?.status() ?? 0,
    sitemapIncludesTarget: sitemapBody.includes(`/products/${target.slug}`),
    sitemapProductCount: productLocCount,
    structuredDataOfferUrlMatchesCanonical:
      metadata.canonical.length > 0 &&
      structuredData.offers?.url === metadata.canonical,
    structuredDataUsesCover:
      typeof structuredData.image === "string" &&
      structuredData.image.includes(coverPath),
    twitterImageUsesCover: metadata.twitterImage.includes(coverPath),
  };
}

async function inspectCartValidation(baseURL: string, target: PublicCatalogItem) {
  const response = await fetch(new URL("/api/cart/validate", baseURL), {
    body: JSON.stringify({
      items: [
        {
          lineTotal: 1,
          price: 1,
          productId: target.edition.id,
          productName: "Fake client title",
          quantity: 1,
          stock: 9999,
        },
      ],
      subtotal: 1,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const text = await response.text();
  const payload = JSON.parse(text) as ApiResponse<{
    items: Array<{
      product: {
        coverPath: string;
        name: string;
        price: number;
      };
    }>;
  }>;
  const line = payload.data?.items[0] ?? null;

  return {
    coverUsesV12Asset: Boolean(
      line?.product.coverPath.includes("/images/books/v12-covers/"),
    ),
    fakeClientFieldsIgnored:
      !text.includes("Fake client title") &&
      line?.product.name === target.edition.displayTitle &&
      line.product.price === target.edition.priceVnd,
    hasForbiddenPublicFields: FORBIDDEN_PUBLIC_FIELDS.test(text),
    serverSnapshotUsesTarget: line?.product.name === target.edition.displayTitle,
    status: response.status,
  };
}

async function inspectCheckoutGate(
  browser: Browser,
  baseURL: string,
  target: PublicCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 900,
    width: 390,
  });
  const page = await context.newPage();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ editionId, storageKey }) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          items: [{ productId: editionId, quantity: 1 }],
          version: 1,
        }),
      );
    },
    { editionId: target.edition.id, storageKey: CART_STORAGE_KEY },
  );
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  const redirectedToAccount = page.url().includes("/account?next=/checkout");
  const cartStorageShape = await page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey);

    return raw ? Object.keys(JSON.parse(raw)).sort() : [];
  }, CART_STORAGE_KEY);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-gate-mobile-en.png"),
  });
  await context.close();

  return {
    cartStorageShape,
    cartStorageShapeOk: cartStorageShape.join(",") === "items,version",
    redirectedToAccount,
  };
}

async function inspectOrderAndExportSnapshots(target: PublicCatalogItem) {
  const admin = createSupabaseAdminClient();
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const email = `caseflow-v12-t16-${runId}@example.com`;
  const orderCode = `CF-V12T16-${Date.now().toString(36).toUpperCase()}`;
  const subtotal = target.edition.priceVnd * 2 + 123_000;
  let userId: string | null = null;

  try {
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: TEST_PASSWORD,
      user_metadata: { full_name: "V12 T16 Customer" },
    });

    if (userError || !userData.user) {
      throw new Error(
        `Could not create V12-T16 user: ${userError?.message ?? "unknown"}`,
      );
    }

    userId = userData.user.id;

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        default_shipping_address: createShippingAddress() as unknown as Json,
        display_name: "V12 T16 Customer",
        email,
        email_verified_at: new Date().toISOString(),
        full_name: "V12 T16 Customer",
        id: userId,
        phone: "+84 912 345 678",
        phone_verified_at: null,
        role: "customer",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw new Error(`Could not create V12-T16 profile: ${profileError.message}`);
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        created_at: `${QA_DATE}T02:00:00.000Z`,
        currency: "VND",
        customer_email: email,
        customer_id: userId,
        customer_name: "V12 T16 Customer",
        customer_phone: "+84 912 345 678",
        discount_total_vnd: 0,
        display_estimate: null,
        fee_estimates: [],
        internal_notes: "V12-T16 internal note sentinel",
        order_code: orderCode,
        payment_fee_vnd: 0,
        payment_method: "bank-transfer",
        payment_status: "awaiting-transfer",
        promotion_code: null,
        shipping_address:
          "12 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City, VN",
        shipping_address_json: createShippingAddress() as unknown as Json,
        shipping_fee_vnd: 0,
        shipping_method: "standard",
        shipping_status: "preparing",
        status: "confirmed",
        subtotal,
        tax_estimates: [],
        tax_total_vnd: 0,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error(
        `Could not create V12-T16 order: ${orderError?.message ?? "unknown"}`,
      );
    }

    const { error: itemError } = await admin.from("order_items").insert([
      {
        book_edition_id: target.edition.id,
        book_work_id: target.work.id,
        edition_format: target.edition.format,
        edition_language: target.edition.language,
        edition_title: target.edition.displayTitle,
        line_total: target.edition.priceVnd * 2,
        line_total_vnd: target.edition.priceVnd * 2,
        order_id: order.id,
        product_name: target.edition.displayTitle,
        quantity: 2,
        unit_price: target.edition.priceVnd,
        unit_price_vnd: target.edition.priceVnd,
      },
      {
        line_total: 123_000,
        order_id: order.id,
        product_name: LEGACY_SNAPSHOT_TITLE,
        quantity: 1,
        unit_price: 123_000,
      },
    ]);

    if (itemError) {
      throw new Error(`Could not create V12-T16 order items: ${itemError.message}`);
    }

    const orderHistory = await listSupabaseOrdersForCustomer(userId);
    const storedOrder = orderHistory.find(
      (record) => record.order.orderCode === orderCode,
    );
    const csv = await createSupabaseOrdersCsvExport({
      from: QA_DATE,
      to: QA_DATE,
    });
    const cleanupResult = await cleanupOrderAndUser(orderCode, userId);

    userId = null;

    return {
      cleanup: cleanupResult,
      csvHasBookSnapshot:
        csv.includes(orderCode) &&
        csv.includes(target.edition.displayTitle) &&
        csv.includes(target.edition.language) &&
        csv.includes(target.edition.format),
      csvHasLegacySnapshot: csv.includes(LEGACY_SNAPSHOT_TITLE),
      csvSensitiveFieldsExcluded:
        !csv.includes(email) &&
        !csv.includes("+84 912 345 678") &&
        !csv.includes("12 Nguyen Hue") &&
        !csv.includes("V12-T16 internal note sentinel"),
      orderCode,
      orderHistoryHasBookSnapshot:
        storedOrder?.items.some(
          (item) =>
            item.productName === target.edition.displayTitle &&
            item.lineTotal === target.edition.priceVnd * 2,
        ) ?? false,
      orderHistoryHasLegacySnapshot:
        storedOrder?.items.some(
          (item) =>
            item.productName === LEGACY_SNAPSHOT_TITLE &&
            item.lineTotal === 123_000,
        ) ?? false,
    };
  } finally {
    if (userId) {
      await cleanupOrderAndUser(orderCode, userId);
    }
  }
}

async function inspectLegacyLinks(baseURL: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("book_catalog_compatibility")
    .select("legacy_slug,behavior")
    .eq("behavior", "retired-to-catalog")
    .order("legacy_slug", { ascending: true });

  if (error) {
    throw new Error(`Could not read compatibility rows: ${error.message}`);
  }

  const retiredSlugs = await Promise.all(
    (data ?? []).map(async (row) => {
      const response = await fetch(new URL(`/products/${row.legacy_slug}`, baseURL));
      const body = await response.text();

      return {
        hasCatalogRecoveryLink:
          body.includes("/catalog") &&
          (body.includes("Browse books") || body.includes("Duyệt sách")),
        legacySlug: row.legacy_slug,
        status: response.status,
      };
    }),
  );

  return {
    compatibilityRows: data?.length ?? 0,
    retiredSlugs,
  };
}

async function inspectDocs() {
  const candidateFiles = [
    "docs/architecture.md",
    "docs/known-limitations.md",
    "docs/v1.2-cover-portfolio.md",
    "docs/v1.2-provenance-content-quality-contracts.md",
    ".agent/project-context.md",
    "../docs/architecture.md",
    "../docs/known-limitations.md",
    "../docs/v1.2-cover-portfolio.md",
    "../docs/v1.2-provenance-content-quality-contracts.md",
    "../.agent/project-context.md",
  ].filter((filePath) => fs.existsSync(filePath));
  const staleClaims = candidateFiles.flatMap((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");

    return STALE_DOC_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => ({
        filePath,
        pattern: pattern.source,
      }),
    );
  });
  const brokenMarkdownLinks = candidateFiles.flatMap(findBrokenMarkdownLinks);

  return {
    brokenMarkdownLinks,
    checkedFiles: candidateFiles,
    noBrokenMarkdownLinks: brokenMarkdownLinks.length === 0,
    noStaleClaims: staleClaims.length === 0,
    staleClaims,
  };
}

async function fetchCatalog(
  baseURL: string,
  params: Record<string, string>,
): Promise<ApiResponse<PublicCatalogItem[], { total?: number }>> {
  const url = new URL("/api/products", baseURL);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Catalog request failed with ${response.status}`);
  }

  return (await response.json()) as ApiResponse<
    PublicCatalogItem[],
    { total?: number }
  >;
}

async function cleanupOrderAndUser(orderCode: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const { data: removedOrders, error: orderError } = await admin
    .from("orders")
    .delete()
    .eq("order_code", orderCode)
    .select("id");

  if (orderError) {
    console.warn(`Could not clean V12-T16 order: ${orderError.message}`);
  }

  const { error: userError } = await admin.auth.admin.deleteUser(userId);

  if (userError) {
    console.warn(`Could not delete V12-T16 auth user: ${userError.message}`);
  }

  return {
    ordersRemoved: removedOrders?.length ?? 0,
    userDeleted: !userError,
  };
}

function createShippingAddress() {
  return {
    countryCode: "VN",
    district: "District 1",
    line1: "12 Nguyen Hue",
    line2: null,
    phone: "+84 912 345 678",
    province: "Ho Chi Minh City",
    recipientName: "V12 T16 Customer",
    ward: "Ben Nghe",
  };
}

async function newLanguageContext(
  browser: Browser,
  baseURL: string,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({ baseURL, viewport });
  const url = new URL(baseURL);

  await context.addCookies([
    {
      domain: url.hostname,
      name: LANGUAGE_COOKIE,
      path: "/",
      sameSite: "Lax",
      secure: url.protocol === "https:",
      value: language,
    },
  ]);

  return context;
}

function findBrokenMarkdownLinks(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const matches = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];

  return matches
    .map((match) => match[1]?.trim() ?? "")
    .filter(
      (href) =>
        href.length > 0 &&
        !href.startsWith("#") &&
        !href.startsWith("http://") &&
        !href.startsWith("https://") &&
        !href.startsWith("mailto:"),
    )
    .map((href) => {
      const targetPath = href.split("#")[0]?.trim() ?? "";

      return {
        filePath,
        href,
        resolvedPath: path.resolve(path.dirname(filePath), targetPath),
      };
    })
    .filter((link) => link.href.length > 0 && !fs.existsSync(link.resolvedPath));
}

function createSearchProbe(value: string) {
  const stopWords = new Set([
    "about",
    "book",
    "edition",
    "nhung",
    "sach",
    "this",
    "trong",
    "with",
  ]);
  const words = stripAccents(value)
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length >= 4 && !stopWords.has(word));

  return required(words.slice(0, 3).join(" "), "Could not build search probe");
}

function stripAccents(value: string) {
  return value
    .replace(/[đĐ]/g, (character) => (character === "Đ" ? "D" : "d"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Base URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined || value === "") {
    throw new Error(message);
  }

  return value;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
