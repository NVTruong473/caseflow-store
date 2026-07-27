import { expect, test, type Page } from "@playwright/test";

import {
  CUSTOMER_GUIDANCE_STORAGE_PREFIX,
  customerGuidanceCopy,
  type CustomerGuidanceTourId,
} from "@/features/guidance/customer-guidance-content";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  deleteTemporaryCustomer,
} from "./helpers/supabase";

test("customer can complete and replay first-use buying guidance", async ({
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
      { suppressGuidance: false },
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const dialog = page.locator(
      "[data-customer-guidance-dialog='getting-started']",
    );

    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-customer-guidance-close]")).toBeFocused();
    await expect(dialog.locator("[data-customer-guidance-slide='1']"))
      .toBeVisible();
    await page.screenshot({
      fullPage: false,
      path: ".agent/artifacts/guidance-t01/getting-started-desktop.png",
    });

    await completeTour(page, "getting-started");
    await expect(dialog).toHaveCount(0);

    await page.reload();
    await expect(dialog).toHaveCount(0);

    const replayButton = page.locator(
      "[data-customer-guidance-open='getting-started']",
    );
    await replayButton.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-customer-guidance-close]")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(replayButton).toBeFocused();
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

test("cart, checkout, and order history expose contextual first-use guidance", async ({
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
      { suppressGuidance: false },
    );
    await page.addInitScript(
      ({ seedKey, storageKey }) => {
        if (window.sessionStorage.getItem(seedKey) === "done") {
          return;
        }

        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            completedTourIds: ["getting-started"],
            version: 1,
          }),
        );
        window.sessionStorage.setItem(seedKey, "done");
      },
      {
        seedKey: `guidance-seed-${customer.id}`,
        storageKey: `${CUSTOMER_GUIDANCE_STORAGE_PREFIX}:${customer.id}`,
      },
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator("[data-cart-drawer-open]").first().click();
    await expect(
      page.locator("[data-customer-guidance-dialog='cart']"),
    ).toBeVisible();
    await completeTour(page, "cart");
    await expect(
      page.locator("[data-customer-guidance-open='cart']"),
    ).toBeVisible();
    await page.locator("[data-cart-drawer-close]").click();

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/checkout");
    await expect(
      page.locator("[data-customer-guidance-dialog='checkout']"),
    ).toBeVisible();
    await page.screenshot({
      fullPage: false,
      path: ".agent/artifacts/guidance-t01/checkout-guide-mobile.png",
    });
    await completeTour(page, "checkout");
    await expect(
      page.locator("[data-customer-guidance-open='checkout']"),
    ).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/account/orders");
    await expect(
      page.locator("[data-customer-guidance-dialog='orders']"),
    ).toBeVisible();
    await completeTour(page, "orders");
    await expect(
      page.locator("[data-customer-guidance-open='orders']"),
    ).toBeVisible();

    const storedGuidance = await page.evaluate(
      (storageKey) => window.localStorage.getItem(storageKey),
      `${CUSTOMER_GUIDANCE_STORAGE_PREFIX}:${customer.id}`,
    );

    expect(JSON.parse(storedGuidance ?? "{}")).toEqual({
      completedTourIds: [
        "getting-started",
        "cart",
        "checkout",
        "orders",
      ],
      version: 1,
    });
    expect(storedGuidance).not.toContain(customer.email);
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

async function completeTour(
  page: Page,
  tourId: CustomerGuidanceTourId,
) {
  const dialog = page.locator(
    `[data-customer-guidance-dialog='${tourId}']`,
  );
  const slideCount = customerGuidanceCopy.en.tours[tourId].slides.length;

  for (let slide = 1; slide < slideCount; slide += 1) {
    await expect(
      dialog.locator(`[data-customer-guidance-slide='${slide}']`),
    ).toBeVisible();
    await dialog.locator("[data-customer-guidance-next]").click();
  }

  await expect(
    dialog.locator(`[data-customer-guidance-slide='${slideCount}']`),
  ).toBeVisible();
  await dialog.locator("[data-customer-guidance-understood]").click();
  await expect(dialog).toHaveCount(0);
}
