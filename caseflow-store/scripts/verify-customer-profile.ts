import fs from "node:fs";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

import { LANGUAGE_COOKIE, type Language } from "../src/lib/i18n/language";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { customerProfileUpdateRequestSchema } from "../src/lib/validation/domain";

loadEnvConfig(process.cwd());

const ARTIFACT_DIR = path.join(".agent", "artifacts", "d31-t02");
const CART_STORAGE_KEY = "caseflow-store.cart.v1";
const TEST_PASSWORD = "CaseflowBooks#31";

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

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const baseURL = parseBaseURL(
    process.env.CUSTOMER_PROFILE_VERIFY_BASE_URL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  const browser = await chromium.launch();
  const runId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const customerEmail = `caseflow-d31-profile-${runId}@example.com`;
  const createdUserIds = new Set<string>();

  try {
    const target = await findTargetEdition(baseURL);
    const customerUserId = await createIncompleteCustomer({
      email: customerEmail,
      fullName: "D31 Profile Customer",
    });
    createdUserIds.add(customerUserId);

    const zodValidation = inspectZodValidation();
    const profileFlow = await inspectProfileFlow(
      browser,
      baseURL,
      customerEmail,
      target,
    );
    const pass = {
      checkoutBlockedUntilProfileComplete:
        profileFlow.checkoutBlockedBeforeProfile &&
        profileFlow.checkoutReadyAfterProfile,
      noOverflow:
        !profileFlow.checkoutBlockedHasOverflow &&
        !profileFlow.profileCompleteHasOverflow &&
        !profileFlow.checkoutReadyHasOverflow &&
        !profileFlow.vietnameseValidation.hasHorizontalOverflow,
      noPhoneVerificationClaim:
        !profileFlow.hasBadPhoneVerificationClaim &&
        !profileFlow.vietnameseValidation.hasBadPhoneVerificationClaim,
      profileCompleted:
        profileFlow.profileIncompleteBeforeSave &&
        profileFlow.profileCompleteAfterSave &&
        profileFlow.profileSaveSuccess,
      profilePrefill:
        profileFlow.checkoutPrefilledName &&
        profileFlow.checkoutPrefilledPhone &&
        profileFlow.checkoutPrefilledAddress,
      zodValidation:
        zodValidation.missingFieldsRejected &&
        zodValidation.invalidPhoneRejected &&
        zodValidation.validProfileAccepted,
      bilingualValidation:
        profileFlow.vietnameseValidation.hasVietnameseAddressError &&
        profileFlow.vietnameseValidation.hasVietnamesePhoneError,
    };
    const ok = Object.values(pass).every(Boolean);
    const report = {
      generatedAt: new Date().toISOString(),
      baseURL,
      ok,
      pass,
      profileFlow,
      target: {
        editionId: target.edition.id,
        slug: target.slug,
      },
      testEmail: customerEmail,
      zodValidation,
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, "customer-profile-check.json"),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(
      JSON.stringify(
        {
          ok,
          pass,
          target: target.slug,
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
    await cleanupUsers([...createdUserIds]);
  }
}

async function inspectVietnameseValidation(
  page: Page,
  baseURL: string,
) {
  const url = new URL(baseURL);

  await page.setViewportSize({ height: 1000, width: 375 });
  await page.context().addCookies([
    {
      name: LANGUAGE_COOKIE,
      value: "vi",
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: url.protocol === "https:",
      sameSite: "Lax",
    },
  ]);
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-profile-form]").waitFor();
  await page.locator("[data-customer-profile-phone]").fill("");
  await page.locator("[data-customer-profile-shipping-phone]").fill("");
  await page.locator("[data-customer-profile-line1]").fill("");
  await page.locator("[data-customer-profile-district]").fill("");
  await page.locator("[data-customer-profile-province]").fill("");
  await page.locator("[data-customer-profile-submit]").click();
  await page.getByText("Nhập số điện thoại hợp lệ.").first().waitFor();
  await page.getByText("Nhập địa chỉ giao hàng.").first().waitFor();

  const text = await page.locator("body").innerText();
  const hasHorizontalOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(
      ARTIFACT_DIR,
      "customer-profile-validation-mobile-vi.png",
    ),
  });

  return {
    hasBadPhoneVerificationClaim: hasBadPhoneVerificationClaim(text),
    hasHorizontalOverflow,
    hasVietnameseAddressError: text.includes("Nhập địa chỉ giao hàng."),
    hasVietnamesePhoneError: text.includes("Nhập số điện thoại hợp lệ."),
  };
}

function inspectZodValidation() {
  const validProfile = {
    fullName: "D31 Profile Customer",
    phone: "+84 912 345 678",
    defaultShippingAddress: {
      recipientName: "D31 Profile Customer",
      phone: "+84 912 345 678",
      line1: "12 Nguyen Hue",
      line2: null,
      ward: "Ben Nghe",
      district: "District 1",
      province: "Ho Chi Minh City",
      countryCode: "VN",
    },
  };

  return {
    invalidPhoneRejected: !customerProfileUpdateRequestSchema.safeParse({
      ...validProfile,
      phone: "abc",
    }).success,
    missingFieldsRejected: !customerProfileUpdateRequestSchema.safeParse({
      fullName: "",
      phone: "+84 912 345 678",
      defaultShippingAddress: null,
    }).success,
    validProfileAccepted:
      customerProfileUpdateRequestSchema.safeParse(validProfile).success,
  };
}

async function inspectProfileFlow(
  browser: Browser,
  baseURL: string,
  email: string,
  target: BookCatalogItem,
) {
  const context = await newLanguageContext(browser, baseURL, "en", {
    height: 1100,
    width: 1440,
  });
  const page = await context.newPage();

  await loginCustomer(page, email);
  await page.locator("[data-customer-profile-form]").waitFor();
  const profileIncompleteBeforeSave =
    (await page
      .locator("[data-customer-profile-form]")
      .getAttribute("data-customer-profile-state")) === "incomplete";

  await seedCart(page, target.edition.id);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-profile-guard]").waitFor();
  await page.locator("[data-checkout-cart-review]").waitFor();
  await page.locator("[data-checkout-submit]").waitFor();
  const checkoutBlockedBeforeProfile =
    (await page
      .locator("[data-checkout-form-shell]")
      .getAttribute("data-checkout-profile-state")) === "blocked" &&
    (await page.locator("[data-checkout-submit]").isDisabled());
  const checkoutBlockedHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-profile-blocked-desktop-en.png"),
  });

  await page.goto("/account?next=/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-profile-form]").waitFor();
  await fillProfileForm(page);
  await page.locator("[data-customer-profile-submit]").click();
  await page.locator("[data-customer-profile-success]").waitFor({
    timeout: 20_000,
  });
  const profileCompleteAfterSave =
    (await page
      .locator("[data-customer-profile-form]")
      .getAttribute("data-customer-profile-state")) === "complete";
  const profileSaveSuccess = await page
    .locator("[data-customer-profile-success]")
    .isVisible();
  const profileCompleteHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "customer-profile-complete-desktop-en.png"),
  });

  await seedCart(page, target.edition.id);
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await page.locator("[data-checkout-profile-ready]").waitFor();
  await page.locator("[data-checkout-submit]").waitFor();
  await waitForEnabled(page, "[data-checkout-submit]");
  const checkoutReadyAfterProfile =
    (await page
      .locator("[data-checkout-form-shell]")
      .getAttribute("data-checkout-profile-state")) === "ready" &&
    !(await page.locator("[data-checkout-submit]").isDisabled());
  const checkoutPrefilledName =
    (await page.locator("[data-checkout-customer-name]").inputValue()) ===
    "D31 Profile Customer";
  const checkoutPrefilledPhone = (
    await page.locator("[data-checkout-customer-phone]").inputValue()
  ).includes("912");
  const checkoutPrefilledAddress = (
    await page.locator("[data-checkout-shipping-address]").inputValue()
  ).includes("Nguyen Hue");
  const finalText = await page.locator("body").innerText();
  const checkoutReadyHasOverflow = await hasOverflow(page);

  await page.screenshot({
    fullPage: true,
    path: path.join(ARTIFACT_DIR, "checkout-profile-ready-desktop-en.png"),
  });
  const vietnameseValidation = await inspectVietnameseValidation(page, baseURL);
  await context.close();

  return {
    checkoutBlockedBeforeProfile,
    checkoutBlockedHasOverflow,
    checkoutPrefilledAddress,
    checkoutPrefilledName,
    checkoutPrefilledPhone,
    checkoutReadyAfterProfile,
    checkoutReadyHasOverflow,
    hasBadPhoneVerificationClaim: hasBadPhoneVerificationClaim(finalText),
    profileCompleteAfterSave,
    profileCompleteHasOverflow,
    profileIncompleteBeforeSave,
    profileSaveSuccess,
    vietnameseValidation,
  };
}

async function loginCustomer(page: Page, email: string) {
  await page.goto("/account", { waitUntil: "domcontentloaded" });
  await page.locator("[data-customer-auth-email]").fill(email);
  await page.locator("[data-customer-auth-password]").fill(TEST_PASSWORD);
  await page.locator("[data-customer-auth-submit]").click();
  await page.locator("[data-customer-account-panel]").waitFor({ timeout: 20_000 });
}

async function fillProfileForm(page: Page) {
  await page.locator("[data-customer-profile-phone]").fill("+84 912 345 678");
  await page
    .locator("[data-customer-profile-recipient-name]")
    .fill("D31 Profile Customer");
  await page
    .locator("[data-customer-profile-shipping-phone]")
    .fill("+84 912 345 678");
  await page.locator("[data-customer-profile-line1]").fill("12 Nguyen Hue");
  await page.locator("[data-customer-profile-ward]").fill("Ben Nghe");
  await page.locator("[data-customer-profile-district]").fill("District 1");
  await page
    .locator("[data-customer-profile-province]")
    .fill("Ho Chi Minh City");
}

async function seedCart(page: Page, editionId: string) {
  await page.context().addInitScript(
    ({ key, productId }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          items: [{ productId, quantity: 1 }],
        }),
      );
    },
    { key: CART_STORAGE_KEY, productId: editionId },
  );
}

async function findTargetEdition(baseURL: string) {
  const url = new URL("/api/products", baseURL);
  url.searchParams.set("availability", "available");
  url.searchParams.set("language", "en");
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
    throw new Error("No available target book edition found");
  }

  return target;
}

async function createIncompleteCustomer(options: {
  email: string;
  fullName: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: options.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: options.fullName,
    },
  });

  if (error || !data.user) {
    throw new Error(
      `Could not create profile test user: ${error?.message ?? "unknown"}`,
    );
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: data.user.id,
      display_name: options.fullName,
      role: "customer",
      full_name: options.fullName,
      email: options.email,
      email_verified_at: now,
      phone: null,
      default_shipping_address: null,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Could not create incomplete profile: ${profileError.message}`);
  }

  return data.user.id;
}

async function cleanupUsers(userIds: string[]) {
  const admin = createSupabaseAdminClient();

  for (const userId of userIds) {
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.warn(`Could not delete test auth user ${userId}: ${error.message}`);
    }
  }
}

async function newLanguageContext(
  browser: Browser,
  baseURL: string,
  language: Language,
  viewport: { height: number; width: number },
) {
  const context = await browser.newContext({
    baseURL,
    viewport,
  });
  const url = new URL(baseURL);

  await context.addCookies([
    {
      name: LANGUAGE_COOKIE,
      value: language,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: url.protocol === "https:",
      sameSite: "Lax",
    },
  ]);

  return context;
}

async function waitForEnabled(page: Page, selector: string) {
  await page.waitForFunction((targetSelector) => {
    const target = document.querySelector<HTMLButtonElement>(targetSelector);

    return Boolean(target && !target.disabled);
  }, selector);
}

async function hasOverflow(page: Page) {
  return page.evaluate(() => {
    const documentElement = document.documentElement;

    return documentElement.scrollWidth > documentElement.clientWidth + 1;
  });
}

function hasBadPhoneVerificationClaim(text: string) {
  return /phone verified|verified phone|số điện thoại đã xác thực|xác thực số điện thoại thành công/i.test(
    text,
  );
}

function parseBaseURL(value: string) {
  const url = new URL(value);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Base URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
