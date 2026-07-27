import { expect, test } from "@playwright/test";

import {
  createTemporaryCustomer,
  deleteTemporaryCustomer,
} from "./helpers/supabase";

const CUSTOMER_NAME = "CaseFlow Customer QA";

test("customer sign-in returns home and exposes the profile name in navigation", async ({
  page,
}) => {
  const customer = await createTemporaryCustomer();

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/account");
    await page.locator("[data-customer-auth-email]").fill(customer.email);
    await page.locator("[data-customer-auth-password]").fill(customer.password);
    await page.locator("[data-customer-auth-submit]").click();

    await expect(page).toHaveURL(/\/$/);
    const guidanceDialog = page.locator(
      "[data-customer-guidance-dialog='getting-started']",
    );
    await expect(guidanceDialog).toBeVisible();
    await expect(
      guidanceDialog.locator("[data-customer-guidance-close]"),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(guidanceDialog).toHaveCount(0);
    const desktopAccount = page.locator("[data-customer-auth-header]");

    await expect(desktopAccount).toHaveAttribute(
      "data-customer-auth-state",
      "signed-in",
    );
    await expect(
      desktopAccount.locator("[data-customer-auth-name]"),
    ).toHaveText(CUSTOMER_NAME);
    await expect(desktopAccount).toHaveAttribute(
      "aria-label",
      new RegExp(CUSTOMER_NAME),
    );
    await page.screenshot({
      fullPage: false,
      path: ".agent/artifacts/auth-ux-t01/customer-name-desktop.png",
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator("[data-mobile-navigation-toggle]").click();
    await expect(
      page.locator("[data-customer-auth-mobile-name]"),
    ).toHaveText(CUSTOMER_NAME);
    await page
      .locator("[data-customer-auth-mobile]")
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      fullPage: false,
      path: ".agent/artifacts/auth-ux-t01/customer-name-mobile.png",
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

test("customer sign-in preserves an explicit checkout return path", async ({
  page,
}) => {
  const customer = await createTemporaryCustomer();

  try {
    await page.goto("/account?next=/checkout");
    await page.locator("[data-customer-auth-email]").fill(customer.email);
    await page.locator("[data-customer-auth-password]").fill(customer.password);
    await page.locator("[data-customer-auth-submit]").click();

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.locator("[data-checkout-page]")).toBeVisible();
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});
