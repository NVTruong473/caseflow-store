import fs from "node:fs";
import path from "node:path";

import { chromium, expect, type BrowserContext, type Page } from "@playwright/test";

import { ensureCustomerSignupVouchers } from "@/lib/repositories/supabase-customer-vouchers";
import {
  addSupabaseSessionCookies,
  clickElement,
  clickFirstVisible,
  createTemporaryCustomer,
  createTestServiceClient,
  deleteTemporaryCustomer,
  fillField,
  findAvailableBook,
  getAdminCredentials,
  NETWORK_OPERATION_TIMEOUT,
  selectFieldOption,
} from "../tests/e2e/helpers/supabase";

const BASE_URL = normalizeBaseUrl(
  process.env.PORTFOLIO_DEMO_BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "https://caseflow-store.vercel.app",
);
const OUTPUT_ROOT = path.resolve(
  process.env.PORTFOLIO_DEMO_OUTPUT_DIR ??
    "docs/portfolio/assets/demo-v1.17.0",
);
const RAW_DIR = path.join(OUTPUT_ROOT, "raw");
const CARD_DIR = path.join(OUTPUT_ROOT, "cards");
const SCREENSHOT_DIR = path.join(OUTPUT_ROOT, "screenshots");
const REPORT_PATH = path.join(OUTPUT_ROOT, "capture-report.json");
const VIEWPORT = { height: 720, width: 1280 };
const VIDEO_SIZE = { height: 720, width: 1280 };
const LANGUAGE_COOKIE = "caseflow-books.language";
const PORTFOLIO_DISPLAY_NAME = "Doc gia CaseFlow";

type CaptureReport = {
  baseUrl: string;
  cards: string[];
  checks: {
    adminOrderUpdated: boolean;
    consoleErrors: number;
    customerOrderCreated: boolean;
    qrExperienceCompleted: boolean;
    temporaryDataRemoved: boolean;
  };
  generatedAt: string;
  ok: boolean;
  rawVideos: string[];
  screenshots: string[];
  targetBook: {
    editionId: string;
    slug: string;
    title: string;
  };
};

async function main() {
  prepareOutputDirectories();

  const browser = await chromium.launch({ headless: true });
  const customer = await createTemporaryCustomer();
  const service = createTestServiceClient();
  const consoleErrors: string[] = [];
  let temporaryDataRemoved = false;
  let orderCode: string | null = null;
  let orderId: string | null = null;
  let qrExperienceCompleted = false;
  let adminOrderUpdated = false;
  let targetBook: Awaited<ReturnType<typeof findAvailableBook>> | null = null;

  try {
    await service.auth.admin.updateUserById(customer.id, {
      user_metadata: {
        display_name: PORTFOLIO_DISPLAY_NAME,
        full_name: PORTFOLIO_DISPLAY_NAME,
      },
    });
    const { error: profileError } = await service
      .from("profiles")
      .update({
        default_shipping_address: {
          countryCode: "VN",
          district: "District 1",
          line1: "12 Nguyen Hue",
          line2: null,
          phone: "+84 912 345 678",
          province: "Ho Chi Minh City",
          recipientName: PORTFOLIO_DISPLAY_NAME,
          ward: "Ben Nghe",
        },
        display_name: PORTFOLIO_DISPLAY_NAME,
        full_name: PORTFOLIO_DISPLAY_NAME,
      })
      .eq("id", customer.id);

    if (profileError) {
      throw profileError;
    }

    await ensureCustomerSignupVouchers(customer.id);
    await captureCards(browser);

    const customerCapture = await captureCustomerJourney({
      browser,
      consoleErrors,
      customer,
    });
    targetBook = customerCapture.book;
    orderCode = customerCapture.orderCode;
    qrExperienceCompleted = customerCapture.qrExperienceCompleted;

    const { data: order, error: orderError } = await service
      .from("orders")
      .select("id")
      .eq("order_code", orderCode)
      .single();

    if (orderError || !order) {
      throw orderError ?? new Error("Portfolio order could not be reloaded");
    }
    orderId = order.id;

    adminOrderUpdated = await captureAdminOperations({
      browser,
      consoleErrors,
      orderCode,
      orderId,
    });

    await captureMobileScreenshots({
      browser,
      customer,
      orderCode,
    });
  } finally {
    await browser.close();
    await deleteTemporaryCustomer(customer);
    temporaryDataRemoved = true;
  }

  if (!targetBook || !orderCode || !orderId) {
    throw new Error("Portfolio capture did not complete the order journey");
  }

  const report: CaptureReport = {
    baseUrl: BASE_URL,
    cards: relativeFiles(CARD_DIR),
    checks: {
      adminOrderUpdated,
      consoleErrors: consoleErrors.length,
      customerOrderCreated: Boolean(orderCode),
      qrExperienceCompleted,
      temporaryDataRemoved,
    },
    generatedAt: new Date().toISOString(),
    ok:
      adminOrderUpdated &&
      consoleErrors.length === 0 &&
      qrExperienceCompleted &&
      temporaryDataRemoved,
    rawVideos: relativeFiles(RAW_DIR),
    screenshots: relativeFiles(SCREENSHOT_DIR),
    targetBook: {
      editionId: targetBook.edition.id,
      slug: targetBook.slug,
      title: targetBook.title,
    },
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  if (!report.ok) {
    throw new Error(`Portfolio capture failed: ${JSON.stringify(report.checks)}`);
  }

  console.log(JSON.stringify(report, null, 2));
}

async function captureCustomerJourney({
  browser,
  consoleErrors,
  customer,
}: {
  browser: Awaited<ReturnType<typeof chromium.launch>>;
  consoleErrors: string[];
  customer: Awaited<ReturnType<typeof createTemporaryCustomer>>;
}) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    colorScheme: "light",
    recordVideo: { dir: RAW_DIR, size: VIDEO_SIZE },
    reducedMotion: "no-preference",
    viewport: VIEWPORT,
  });
  await addSupabaseSessionCookies(
    context,
    BASE_URL,
    customer.email,
    customer.password,
  );
  await setVietnameseLanguage(context);

  const page = await context.newPage();
  collectPageErrors(page, consoleErrors, "customer");
  const video = page.video();
  const book = await findAvailableBook(page.request, { minStock: 3 });
  let orderCode = "";
  let qrExperienceCompleted = false;

  try {
    await page.goto("/", { waitUntil: "networkidle" });
    await showChapter(page, "01", "Khám phá sách theo nhu cầu đọc");
    await expect(page.locator("[data-home-section='hero']")).toBeVisible();
    await screenshot(page, "01-homepage-desktop.png");
    await hold(4_000);

    await page.locator("[data-home-section='categories']").scrollIntoViewIfNeeded();
    await hold(2_500);
    const category = page.locator("[data-origin-effect='category-cover-reveal']").first();
    if (await category.count()) {
      await category.hover();
      await hold(2_000);
    }

    await page.goto("/catalog?q=alice&language=en&sort=title-asc", {
      waitUntil: "networkidle",
    });
    await showChapter(page, "02", "Catalog, bộ lọc và dữ liệu ấn bản");
    await expect(page.locator("[data-catalog-grid]")).toBeVisible();
    await screenshot(page, "02-catalog-desktop.png");
    await hold(5_000);

    await page.goto(`/products/${book.slug}`, { waitUntil: "networkidle" });
    await showChapter(page, "03", "Chi tiết ấn bản và hai đường mua");
    await expect(page.locator("[data-book-purchase-controls]")).toBeVisible();
    const cover = page.locator("[data-book-detail-image]");
    const coverBox = await cover.boundingBox();
    if (coverBox) {
      await page.mouse.move(
        coverBox.x + coverBox.width * 0.65,
        coverBox.y + coverBox.height * 0.4,
      );
      await hold(2_500);
    }
    await fillField(page, "[data-book-quantity-input]", "1");
    await clickElement(page, "[data-book-add-to-cart-button]");
    await expect(page.locator("[data-book-add-to-cart-feedback='success']"))
      .toBeVisible();
    await fillField(page, "[data-book-quantity-input]", "2");
    await screenshot(page, "03-product-buy-now-desktop.png");
    await hold(5_000);

    await clickElement(page, "[data-book-buy-now-button]");
    await expect(page).toHaveURL(/\/checkout\?.*mode=buy-now/);
    await expect(page.locator("[data-checkout-buy-now-scope]")).toBeVisible();
    await showChapter(page, "04", "Mua ngay vẫn giữ nguyên giỏ hàng");
    await screenshot(page, "04-buy-now-checkout-desktop.png");
    await hold(6_000);

    await clickElement(page, "[data-checkout-mode='experience']");
    await clickElement(page, "[data-checkout-experience-create]");
    await expect(page.locator("[data-checkout-experience-qr]")).toBeVisible();
    await showChapter(page, "05", "QR trải nghiệm tách biệt thanh toán thật");
    await screenshot(page, "05-qr-experience-pending-desktop.png");
    await hold(5_000);

    const scanUrl = await page
      .locator("[data-checkout-experience-open]")
      .getAttribute("href");
    const confirmationCode = (
      await page.locator("[data-checkout-experience-code]").innerText()
    ).trim();
    const amountVnd = Number(
      (
        await page.locator("[data-checkout-experience-amount]").innerText()
      ).replace(/\D/g, ""),
    );

    if (!scanUrl || !/^\d{6}$/.test(confirmationCode) || amountVnd <= 0) {
      throw new Error("QR experience did not provide safe completion values");
    }

    const phoneContext = await browser.newContext({
      colorScheme: "light",
      viewport: { height: 844, width: 390 },
    });
    const phonePage = await phoneContext.newPage();
    collectPageErrors(phonePage, consoleErrors, "phone");
    try {
      await phonePage.goto(scanUrl, { waitUntil: "networkidle" });
      await fillField(
        phonePage,
        "[data-transfer-experience-amount-input]",
        amountVnd.toString(),
      );
      await fillField(
        phonePage,
        "[data-transfer-experience-code-input]",
        confirmationCode,
      );
      await clickElement(phonePage, "[data-transfer-experience-submit]");
      await expect(
        phonePage.locator("[data-transfer-experience-status='success']"),
      ).toBeVisible();
      await phonePage.screenshot({
        fullPage: true,
        path: path.join(SCREENSHOT_DIR, "06-qr-phone-completed-mobile.png"),
      });
    } finally {
      await phoneContext.close();
    }

    await expect(
      page.locator("[data-checkout-experience-status='completed']"),
    ).toBeVisible({ timeout: 20_000 });
    qrExperienceCompleted = true;
    await screenshot(page, "06-qr-experience-completed-desktop.png");
    await hold(5_000);

    await clickElement(page, "[data-checkout-mode='official']");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await clickElement(
      page,
      "[data-checkout-apply-signup-voucher='WELCOME30K']",
    );
    await expect(page.locator("[data-checkout-promotion-code]"))
      .toHaveValue("WELCOME30K");
    await clickElement(page, "[data-checkout-payment-method='cod']");
    await showChapter(page, "07", "Đơn chính thức dùng tổng tiền phía server");
    await hold(4_000);

    const orderResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/orders" &&
        response.request().method() === "POST",
      { timeout: NETWORK_OPERATION_TIMEOUT },
    );
    await clickElement(page, "[data-checkout-submit]");
    const orderResponse = await orderResponsePromise;
    expect(orderResponse.status()).toBe(201);
    await expect(page).toHaveURL(/\/checkout\/success\?orderCode=CF-/);
    orderCode = (
      await page.locator("[data-checkout-success-code]").innerText()
    ).trim();
    await screenshot(page, "07-order-success-desktop.png");
    await hold(6_000);

    await page.goto("/account/orders", { waitUntil: "networkidle" });
    await expect(
      page.locator(`[data-customer-order-card='${orderCode}']`),
    ).toBeVisible();
    await showChapter(page, "08", "Lịch sử đơn gắn với tài khoản");
    await screenshot(page, "08-customer-order-history-desktop.png");
    await hold(7_000);
  } finally {
    await context.close();
    if (video) {
      await saveRecordedVideo(video, "customer-journey.webm");
    }
  }

  return { book, orderCode, qrExperienceCompleted };
}

async function captureAdminOperations({
  browser,
  consoleErrors,
  orderCode,
  orderId,
}: {
  browser: Awaited<ReturnType<typeof chromium.launch>>;
  consoleErrors: string[];
  orderCode: string;
  orderId: string;
}) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    colorScheme: "light",
    recordVideo: { dir: RAW_DIR, size: VIDEO_SIZE },
    reducedMotion: "no-preference",
    viewport: VIEWPORT,
  });
  const admin = getAdminCredentials();
  await addSupabaseSessionCookies(context, BASE_URL, admin.email, admin.password);
  await setVietnameseLanguage(context);
  const page = await context.newPage();
  collectPageErrors(page, consoleErrors, "admin");
  const video = page.video();
  let updated = false;

  try {
    await page.goto("/admin?range=30d", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-admin-dashboard-page]")).toBeVisible();
    await showChapter(page, "09", "Dashboard vận hành theo vai trò");
    await screenshot(page, "09-admin-dashboard-desktop.png");
    await page.locator("[data-admin-dashboard-recent-orders]").scrollIntoViewIfNeeded();
    await hold(6_000);

    await page.goto(`/admin/orders?q=${encodeURIComponent(orderCode)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator(`[data-admin-order-row='${orderId}']`))
      .toBeVisible();
    await clickFirstVisible(page, `[data-admin-order-view='${orderId}']`);
    await expect(page.locator("[data-admin-order-detail-code]"))
      .toHaveText(orderCode);
    await showChapter(page, "10", "Kiểm tra và chuyển trạng thái đơn");
    await screenshot(page, "10-admin-order-detail-desktop.png");
    await hold(5_000);

    await selectFieldOption(page, "[data-admin-order-status-select]", "confirmed");
    const responsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === `/api/admin/orders/${orderId}` &&
        response.request().method() === "PATCH",
      { timeout: NETWORK_OPERATION_TIMEOUT },
    );
    await clickElement(page, "[data-admin-order-status-submit]");
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(page.locator("[data-admin-order-status-success]")).toBeVisible();
    updated = true;
    await screenshot(page, "11-admin-order-confirmed-desktop.png");
    await hold(7_000);
  } finally {
    await context.close();
    if (video) {
      await saveRecordedVideo(video, "admin-operations.webm");
    }
  }

  return updated;
}

async function captureMobileScreenshots({
  browser,
  customer,
  orderCode,
}: {
  browser: Awaited<ReturnType<typeof chromium.launch>>;
  customer: Awaited<ReturnType<typeof createTemporaryCustomer>>;
  orderCode: string;
}) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    colorScheme: "light",
    reducedMotion: "reduce",
    viewport: { height: 844, width: 390 },
  });
  await addSupabaseSessionCookies(
    context,
    BASE_URL,
    customer.email,
    customer.password,
  );
  await setVietnameseLanguage(context);
  const page = await context.newPage();

  try {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.screenshot({
      fullPage: false,
      path: path.join(SCREENSHOT_DIR, "12-homepage-mobile.png"),
    });
    await page.goto("/account/orders", { waitUntil: "networkidle" });
    await expect(
      page.locator(`[data-customer-order-card='${orderCode}']`),
    ).toBeVisible();
    await page.screenshot({
      fullPage: true,
      path: path.join(SCREENSHOT_DIR, "13-customer-orders-mobile.png"),
    });
  } finally {
    await context.close();
  }
}

async function captureCards(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    await renderCard(
      page,
      "title-card.png",
      `
        <p class="eyebrow">FULL-STACK E-COMMERCE SHOWROOM</p>
        <h1>CaseFlow Books</h1>
        <p class="lead">Book discovery, trusted checkout and small-business operations in one Next.js modular monolith.</p>
        <div class="meta"><span>v1.17.0</span><span>500 editions</span><span>VI / EN</span></div>
      `,
    );
    await renderCard(
      page,
      "architecture-card.png",
      `
        <p class="eyebrow">LAYER ARCHITECTURE</p>
        <h1 class="compact">Six explicit responsibilities</h1>
        <div class="layers">
          <div><b>1</b><span>Presentation</span><small>App Router, features, browser state</small></div>
          <div><b>2</b><span>HTTP Controllers</span><small>Route Handlers and stable API envelopes</small></div>
          <div><b>3</b><span>Application</span><small>Order, cancellation and operations use cases</small></div>
          <div><b>4</b><span>Domain &amp; Policy</span><small>Zod, auth, totals and transitions</small></div>
          <div><b>5</b><span>Data &amp; Integration</span><small>Repositories and provider adapters</small></div>
          <div><b>6</b><span>Infrastructure</span><small>Supabase Auth, PostgreSQL, RLS, RPC, Vercel</small></div>
        </div>
      `,
    );
    await renderCard(
      page,
      "outro-card.png",
      `
        <p class="eyebrow">VERIFIED PORTFOLIO PACKAGE</p>
        <h1 class="compact">Evidence before claims.</h1>
        <p class="lead">Architecture, release notes, Playwright flows, security gates and honest operational boundaries.</p>
        <div class="links">
          <span>caseflow-store.vercel.app</span>
          <span>github.com/NVTruong473/caseflow-store</span>
        </div>
      `,
    );
  } finally {
    await context.close();
  }
}

async function renderCard(page: Page, fileName: string, body: string) {
  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body {
            width: 1280px;
            height: 720px;
            margin: 0;
            overflow: hidden;
            color: #1f1b16;
            background:
              linear-gradient(90deg, #c92127 0 18px, transparent 18px),
              #f7f8f5;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
          }
          main {
            height: 100%;
            padding: 78px 96px 64px 118px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .eyebrow {
            margin: 0 0 20px;
            color: #c92127;
            font-size: 18px;
            font-weight: 700;
          }
          h1 {
            max-width: 980px;
            margin: 0;
            font-size: 82px;
            line-height: 1.04;
          }
          h1.compact { font-size: 58px; }
          .lead {
            max-width: 900px;
            margin: 26px 0 0;
            color: #675f56;
            font-size: 28px;
            line-height: 1.45;
          }
          .meta, .links {
            display: flex;
            gap: 14px;
            margin-top: 38px;
            color: #2d6e62;
            font-size: 20px;
            font-weight: 650;
          }
          .meta span {
            padding-right: 14px;
            border-right: 1px solid #dbe0d8;
          }
          .meta span:last-child { border-right: 0; }
          .links { flex-direction: column; }
          .layers {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 28px;
          }
          .layers div {
            display: grid;
            grid-template-columns: 42px 190px 1fr;
            align-items: center;
            min-height: 66px;
            padding: 12px 18px;
            border-left: 4px solid #c92127;
            background: #fff;
            box-shadow: 0 6px 18px rgb(31 27 22 / 8%);
          }
          .layers b { color: #c92127; font-size: 22px; }
          .layers span { font-size: 20px; font-weight: 700; }
          .layers small { color: #675f56; font-size: 14px; line-height: 1.35; }
        </style>
      </head>
      <body><main>${body}</main></body>
    </html>
  `);
  await page.screenshot({
    path: path.join(CARD_DIR, fileName),
  });
}

async function showChapter(page: Page, number: string, title: string) {
  await page.evaluate(
    ({ chapterNumber, chapterTitle }) => {
      document.querySelector("[data-portfolio-chapter]")?.remove();
      const chapter = document.createElement("aside");
      chapter.setAttribute("data-portfolio-chapter", "");
      chapter.setAttribute("aria-hidden", "true");
      chapter.innerHTML = `<b>${chapterNumber}</b><span>${chapterTitle}</span>`;
      Object.assign(chapter.style, {
        alignItems: "center",
        background: "rgba(31, 27, 22, 0.94)",
        borderLeft: "4px solid #c92127",
        bottom: "28px",
        boxShadow: "0 12px 32px rgba(0,0,0,.22)",
        color: "#fff",
        display: "flex",
        fontFamily: "Inter, system-ui, sans-serif",
        gap: "12px",
        left: "28px",
        maxWidth: "620px",
        padding: "14px 18px",
        position: "fixed",
        zIndex: "2147483647",
      });
      const badge = chapter.querySelector("b") as HTMLElement;
      Object.assign(badge.style, {
        color: "#ff777b",
        fontSize: "15px",
      });
      const label = chapter.querySelector("span") as HTMLElement;
      Object.assign(label.style, {
        fontSize: "18px",
        fontWeight: "650",
        lineHeight: "1.35",
      });
      document.body.appendChild(chapter);
    },
    { chapterNumber: number, chapterTitle: title },
  );
  await hold(2_600);
  await page.evaluate(() =>
    document.querySelector("[data-portfolio-chapter]")?.remove(),
  );
}

async function screenshot(page: Page, fileName: string) {
  await page.screenshot({
    fullPage: false,
    path: path.join(SCREENSHOT_DIR, fileName),
  });
}

function collectPageErrors(
  page: Page,
  errors: string[],
  label: string,
) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`${label}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`${label}: ${error.message}`);
  });
}

async function setVietnameseLanguage(context: BrowserContext) {
  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      url: BASE_URL,
      value: "vi",
    },
  ]);
}

function prepareOutputDirectories() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  for (const directory of [RAW_DIR, CARD_DIR, SCREENSHOT_DIR]) {
    fs.rmSync(directory, { force: true, recursive: true });
    fs.mkdirSync(directory, { recursive: true });
  }
}

function relativeFiles(directory: string) {
  return fs
    .readdirSync(directory)
    .filter((entry) => fs.statSync(path.join(directory, entry)).isFile())
    .sort()
    .map((entry) => path.relative(OUTPUT_ROOT, path.join(directory, entry)));
}

function normalizeBaseUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Portfolio demo URL must use HTTP or HTTPS");
  }
  return url.toString().replace(/\/$/, "");
}

function hold(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function saveRecordedVideo(
  video: NonNullable<ReturnType<Page["video"]>>,
  fileName: string,
) {
  const sourcePath = await video.path();
  const targetPath = path.join(RAW_DIR, fileName);
  await video.saveAs(targetPath);

  if (path.resolve(sourcePath) !== path.resolve(targetPath)) {
    fs.rmSync(sourcePath, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
