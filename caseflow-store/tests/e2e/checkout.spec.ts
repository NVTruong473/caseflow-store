import { expect, type Page, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  CHECKOUT_SUCCESS_STORAGE_KEY,
  clickElement,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
  findAvailableBook,
  NETWORK_OPERATION_TIMEOUT,
  seedCart,
} from "./helpers/supabase";

const CHECKOUT_SUCCESS_SCREENSHOT =
  ".agent/artifacts/checkout-mode-t01-official-success-desktop-vi.png";

test("checkout happy path creates a simulated book order and clears the cart", async ({
  baseURL,
  context,
  page,
}) => {
  expect(baseURL).toBeTruthy();
  const customer = await createTemporaryCustomer();

  try {
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );
    const book = await findAvailableBook(page.request);
    await seedCart(page, [{ productId: book.edition.id, quantity: 1 }]);

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await expect(page.locator("[data-checkout-line-item]").first())
      .toContainText(book.title);
    await expect(page.locator("[data-checkout-final-total]")).toBeVisible();
    await expectNoPaymentCardInputs(page);

    await clickElement(page, "[data-checkout-payment-method='bank-transfer']");
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
    await expect(page.locator("[data-checkout-success-code]")).toHaveText(
      /^CF-/,
    );
    await expect(page.locator("[data-checkout-success-status]")).toHaveText(
      "Pending",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Order received",
    );
    await expect(page.locator("[data-checkout-success-items]"))
      .toContainText(book.title);
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "0");
    await expectNoPaymentCardInputs(page);

    const storageState = await page.evaluate((successKey) => {
      return JSON.parse(window.sessionStorage.getItem(successKey) ?? "{}") as {
        itemCount?: number;
        orderCode?: string;
        status?: string;
        version?: number;
      };
    }, CHECKOUT_SUCCESS_STORAGE_KEY);

    expect(storageState).toMatchObject({
      itemCount: 1,
      status: "pending",
      version: 2,
    });
    expect(storageState.orderCode).toMatch(/^CF-/);

    await clickElement(page, "[data-language-option='vi']:visible");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Đơn hàng đã được ghi nhận",
    );
    await expect(page.locator("[data-checkout-success-status]")).toHaveText(
      "Đang chờ",
    );
    await expectSuccessSummaryToFit(page);

    await page.screenshot({
      fullPage: true,
      path: CHECKOUT_SUCCESS_SCREENSHOT,
      timeout: 30_000,
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

test("checkout separates order placement from the isolated QR experience", async ({
  baseURL,
  browser,
  context,
  page,
}) => {
  expect(baseURL).toBeTruthy();
  const customer = await createTemporaryCustomer();
  const businessMutationRequests: string[] = [];

  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;

    if (
      request.method() === "POST" &&
      (pathname === "/api/orders" ||
        pathname === "/api/payments" ||
        pathname.includes("/api/dev/payments/"))
    ) {
      businessMutationRequests.push(pathname);
    }
  });

  try {
    await addSupabaseSessionCookies(
      context,
      baseURL!,
      customer.email,
      customer.password,
    );
    const book = await findAvailableBook(page.request);
    await seedCart(page, [{ productId: book.edition.id, quantity: 1 }]);

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    const languageResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/preferences/language" &&
        response.request().method() === "POST",
    );
    await clickElement(page, "[data-language-option='vi']:visible");
    expect((await languageResponse).status()).toBe(200);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Thanh toán",
    );
    await expect(page.locator("[data-checkout-mode='official']"))
      .toHaveAttribute("aria-selected", "true");
    await page.locator("[data-checkout-mode='official']").press("ArrowRight");
    await expect(page.locator("[data-checkout-mode='experience']"))
      .toBeFocused();
    await expect(page.locator("[data-checkout-mode='experience']"))
      .toHaveAttribute("aria-selected", "true");

    await expect(page.locator("[data-checkout-experience]")).toBeVisible();
    await expect(page.locator("[data-checkout-experience-create]")).toBeEnabled();
    await clickElement(page, "[data-checkout-experience-create]");

    await expect(page.locator("[data-checkout-experience-qr]")).toBeVisible();
    const qrBox = await page
      .locator("[data-checkout-experience-qr]")
      .boundingBox();
    expect(qrBox).toBeTruthy();
    expect(Math.abs(qrBox!.width - qrBox!.height)).toBeLessThanOrEqual(1);
    expect(qrBox!.width).toBeLessThanOrEqual(320);
    await expect(page.locator("[data-checkout-experience-status='pending']"))
      .toBeVisible();
    await expect(page.locator("[data-checkout-experience-countdown]"))
      .toBeVisible();
    await expect(page.locator("[data-checkout-experience-amount]"))
      .toContainText("₫");

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
    const parsedScanUrl = new URL(scanUrl!);
    expect(parsedScanUrl.pathname).toBe("/experience/transfer");
    expect(parsedScanUrl.searchParams.get("lang")).toBe("vi");
    expect(parsedScanUrl.hash.length).toBeGreaterThan(40);
    expect(confirmationCode).toMatch(/^\d{6}$/);
    expect(amountVnd).toBeGreaterThan(0);

    const phoneContext = await browser.newContext({
      viewport: { height: 812, width: 375 },
    });
    try {
      const phonePage = await phoneContext.newPage();
      phonePage.on("request", (request) => {
        const pathname = new URL(request.url()).pathname;

        if (
          request.method() === "POST" &&
          (pathname === "/api/orders" ||
            pathname === "/api/payments" ||
            pathname.includes("/api/dev/payments/"))
        ) {
          businessMutationRequests.push(pathname);
        }
      });
      await phonePage.goto(scanUrl!, { waitUntil: "domcontentloaded" });
      await expect(
        phonePage.locator("[data-transfer-experience-warning]"),
      ).toContainText("KHÔNG CHUYỂN TIỀN THẬT");
      await expect(
        phonePage.locator("meta[name='robots']"),
      ).toHaveAttribute("content", /noindex/);
      await expect(
        phonePage.locator("[data-transfer-experience-form]"),
      ).toBeVisible();
      await expect(phonePage.locator("input[type='password']")).toHaveCount(0);
      const phoneDocument = await phonePage.locator("body").innerText();
      expect(phoneDocument).not.toContain(customer.email);
      expect(phoneDocument).not.toContain(customer.password);
      expect(phoneDocument).not.toContain(book.title);
      await phonePage.screenshot({
        fullPage: false,
        path: ".agent/artifacts/qr-xdevice-t03/phone-pending-375-vi.png",
      });
      await phonePage
        .locator("[data-transfer-experience-amount-input]")
        .fill(amountVnd.toString());
      await phonePage
        .locator("[data-transfer-experience-code-input]")
        .fill(confirmationCode);
      await phonePage
        .locator("[data-transfer-experience-submit]")
        .click();
      await expect(
        phonePage.locator("[data-transfer-experience-status='success']"),
      ).toBeVisible();
      await expectNoHorizontalOverflow(phonePage);
      await phonePage.screenshot({
        fullPage: true,
        path: ".agent/artifacts/qr-xdevice-t03/phone-completed-375-vi.png",
      });
    } finally {
      await phoneContext.close();
    }

    await expect(
      page.locator("[data-checkout-experience-status='completed']"),
    ).toBeVisible({ timeout: 10_000 });
    expect(businessMutationRequests).toEqual([]);
    await expect(page.locator("[data-cart-count]").first())
      .toHaveAttribute("data-cart-count", "1");

    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/qr-xdevice-t03/desktop-completed-1440-vi.png",
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      fullPage: true,
      path: ".agent/artifacts/qr-xdevice-t03/desktop-session-mobile-375-vi.png",
    });

    await clickElement(page, "[data-checkout-experience-reset]");
    await clickElement(page, "[data-checkout-experience-create]");
    const cancellableScanUrl = await page
      .locator("[data-checkout-experience-open]")
      .getAttribute("href");
    const cancellableToken = new URL(cancellableScanUrl!).hash.slice(1);
    const cancelResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          "/api/checkout-experience/cancel" &&
        response.request().method() === "POST",
    );
    await clickElement(page, "[data-checkout-experience-reset]");
    expect((await cancelResponse).status()).toBe(200);
    const cancelledStatusResponse = await page.request.post(
      "/api/checkout-experience/status",
      { data: { token: cancellableToken } },
    );
    expect(cancelledStatusResponse.status()).toBe(200);
    const cancelledStatus = (await cancelledStatusResponse.json()) as {
      data?: { status?: string };
    };
    expect(cancelledStatus.data?.status).toBe("cancelled");

    await clickElement(page, "[data-checkout-mode='official']");
    await expect(page.locator("[data-checkout-form-shell]")).toBeVisible();
    await expect(page.locator("[data-checkout-mode='official']"))
      .toHaveAttribute("aria-selected", "true");
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

test("checkout success summary contains long localized payment values", async ({
  page,
}) => {
  const orderCode = "CF-LAYOUT-CHECK-1234567890";

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await clickElement(page, "[data-language-option='vi']:visible");
  await page.evaluate(
    ({ key, orderCodeValue }) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          createdAt: new Date().toISOString(),
          itemCount: 1,
          items: [
            {
              lineTotal: 172_400,
              productName: "A Christmas Carol",
              quantity: 1,
            },
          ],
          orderCode: orderCodeValue,
          paymentMethod: "bank-transfer",
          paymentStatus: "awaiting-transfer",
          status: "pending",
          subtotal: 172_400,
          version: 2,
        }),
      );
    },
    { key: CHECKOUT_SUCCESS_STORAGE_KEY, orderCodeValue: orderCode },
  );

  await page.goto(`/checkout/success?orderCode=${orderCode}`, {
    waitUntil: "domcontentloaded",
  });
  await clickElement(page, "[data-language-option='vi']:visible");

  await expect(page.locator("[data-checkout-success-payment-method]"))
    .toHaveText("Chuyển khoản");
  await expect(page.locator("[data-checkout-success-payment-status]"))
    .toHaveText("Đang chờ chuyển khoản");
  await expectSuccessSummaryToFit(page);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/checkout-mode-t01-success-desktop-vi.png",
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    fullPage: true,
    path: ".agent/artifacts/checkout-mode-t01-success-mobile-vi.png",
  });
});

test("checkout success page shows a direct-link fallback without session data", async ({
  page,
}) => {
  await page.goto("/checkout/success?orderCode=CF-SKELETON", {
    waitUntil: "domcontentloaded",
  });

  await expect(page.locator("[data-checkout-success-missing]")).toBeVisible();
  await expect(page.locator("[data-checkout-success-code]")).toHaveText(
    "CF-SKELETON",
  );
});

async function expectNoPaymentCardInputs(page: Page) {
  const inputDescriptors = await page.locator("input, textarea").evaluateAll(
    (fields) =>
      fields.map((field) =>
        [
          field.getAttribute("id"),
          field.getAttribute("name"),
          field.getAttribute("aria-label"),
          field.getAttribute("placeholder"),
        ]
          .filter(Boolean)
          .join(" "),
      ),
  );

  expect(inputDescriptors.join(" ")).not.toMatch(
    /\b(card|cvv|cvc|expiry|expiration)\b/i,
  );
}

async function expectSuccessSummaryToFit(page: Page) {
  const result = await page
    .locator("[data-checkout-success-summary]")
    .evaluate((summary) => {
      const summaryRect = summary.getBoundingClientRect();
      const values = Array.from(summary.querySelectorAll("dd"));

      return values.map((value) => {
        const valueRect = value.getBoundingClientRect();
        const style = window.getComputedStyle(value);

        return {
          inside:
            valueRect.left >= summaryRect.left - 1 &&
            valueRect.right <= summaryRect.right + 1,
          noLineThrough: style.textDecorationLine !== "line-through",
          noOverflow: value.scrollWidth <= value.clientWidth + 1,
        };
      });
    });

  expect(result.length).toBeGreaterThan(0);
  expect(result.every((entry) => entry.inside)).toBe(true);
  expect(result.every((entry) => entry.noLineThrough)).toBe(true);
  expect(result.every((entry) => entry.noOverflow)).toBe(true);
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );

  expect(hasOverflow).toBe(false);
}
