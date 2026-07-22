import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import {
  expect,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import type { Database } from "@/types/supabase";

export const CART_STORAGE_VERSION = 1;
export const CART_STORAGE_KEY = "caseflow-store.cart.v1";
export const CHECKOUT_SUCCESS_STORAGE_KEY =
  "caseflow-store.checkout.success.v1";
export const CHECKOUT_ATTEMPT_STORAGE_KEY =
  "caseflow-books.checkout-attempt.v1";

export type TestBook = {
  slug: string;
  title: string;
  edition: {
    id: string;
    priceVnd: number;
    stockQuantity: number;
  };
};

export type TestCustomer = {
  id: string;
  email: string;
  password: string;
};

type CapturedCookie = {
  name: string;
  value: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

export function getAdminCredentials() {
  return {
    email: requireEnvironmentValue("CASEFLOW_ADMIN_EMAIL"),
    password: requireEnvironmentValue("CASEFLOW_ADMIN_PASSWORD"),
  };
}

export function createTestServiceClient() {
  return createClient<Database>(
    requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironmentValue("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function createTestPublicClient() {
  return createClient<Database>(
    requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function loginAsAdmin(page: Page) {
  const credentials = getAdminCredentials();

  await addSupabaseSessionCookies(
    page.context(),
    getPlaywrightBaseURL(),
    credentials.email,
    credentials.password,
  );
  await page.goto("/admin/orders");
  await expect(page.locator("[data-admin-orders-page]")).toBeVisible();
}

export async function createTemporaryCustomer(): Promise<TestCustomer> {
  const service = createTestServiceClient();
  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const email = `caseflow.customer.${suffix}@example.com`;
  const password = `Customer-${crypto.randomUUID()}-9a`;
  const fullName = "CaseFlow Customer QA";
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: fullName, full_name: fullName },
  });

  if (error) {
    throw error;
  }

  const now = new Date().toISOString();
  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: data.user.id,
      default_shipping_address: createShippingAddress(fullName),
      display_name: fullName,
      email,
      email_verified_at: now,
      full_name: fullName,
      phone: "+84 912 345 678",
      phone_verified_at: null,
      role: "customer",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await service.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }

  return { id: data.user.id, email, password };
}

export async function deleteTemporaryCustomer(customer: TestCustomer) {
  const service = createTestServiceClient();
  const { error: voucherError } = await service
    .from("customer_promotion_vouchers")
    .delete()
    .eq("customer_id", customer.id);

  if (voucherError) {
    throw voucherError;
  }

  await deleteOrdersByCustomerEmail(customer.email);

  const { error } = await service.auth.admin.deleteUser(customer.id);

  if (error) {
    throw error;
  }
}

export async function addSupabaseSessionCookies(
  context: BrowserContext,
  baseURL: string,
  email: string,
  password: string,
) {
  let cookies: CapturedCookie[] = [];
  const supabase = createServerClient<Database>(
    requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnvironmentValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(nextCookies) {
          const cookieMap = new Map(
            cookies.map((cookie) => [cookie.name, cookie.value]),
          );

          nextCookies.forEach(({ name, value }) => {
            if (value) {
              cookieMap.set(name, value);
            } else {
              cookieMap.delete(name);
            }
          });
          cookies = [...cookieMap].map(([name, value]) => ({ name, value }));
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  await context.addCookies(
    cookies.map(({ name, value }) => ({ name, value, url: baseURL })),
  );
}

export async function findAvailableBook(
  request: APIRequestContext,
  options: { maxStock?: number; minStock?: number } = {},
) {
  const response = await request.get(
    "/api/products?availability=available&language=en&limit=100&sort=title-asc",
  );
  expect(response.status()).toBe(200);

  const payload = (await response.json()) as ApiResponse<TestBook[]>;
  const minStock = options.minStock ?? 1;
  const target = (payload.data ?? []).find((book) => {
    const stock = book.edition.stockQuantity;

    return (
      stock >= minStock &&
      (options.maxStock === undefined || stock <= options.maxStock)
    );
  });

  if (!target) {
    throw new Error("No available test book found");
  }

  return target;
}

export async function seedCart(
  page: Page,
  items: Array<{ productId: string; quantity: number }>,
) {
  const cartPayload = { version: CART_STORAGE_VERSION, items };
  const seedFlag = `caseflow-store.e2e.seed-cart.${Date.now()}-${Math.random()}`;
  await page.addInitScript(
    ({ cartKey, cartItems, seedKey, successKey, version }) => {
      if (window.sessionStorage.getItem(seedKey) === "done") {
        return;
      }

      window.localStorage.setItem(
        cartKey,
        JSON.stringify({ version, items: cartItems }),
      );
      window.sessionStorage.removeItem(successKey);
      window.sessionStorage.setItem(seedKey, "done");
    },
    {
      cartKey: CART_STORAGE_KEY,
      cartItems: items,
      seedKey: seedFlag,
      successKey: CHECKOUT_SUCCESS_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
    },
  );
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        (cartKey) => window.localStorage.getItem(cartKey),
        CART_STORAGE_KEY,
      ),
    )
    .toBe(JSON.stringify(cartPayload));
}

export async function clearClientOrderState(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ({ attemptKey, cartKey, successKey }) => {
      window.localStorage.removeItem(cartKey);
      window.sessionStorage.removeItem(attemptKey);
      window.sessionStorage.removeItem(successKey);
    },
    {
      attemptKey: CHECKOUT_ATTEMPT_STORAGE_KEY,
      cartKey: CART_STORAGE_KEY,
      successKey: CHECKOUT_SUCCESS_STORAGE_KEY,
    },
  );
}

export async function createOrderThroughApi(
  page: Page,
  customer: TestCustomer,
  book: TestBook,
  quantity = 1,
) {
  const response = await page.request.post("/api/orders", {
    data: createOrderPayload(customer, book, quantity),
  });

  expect(response.status()).toBe(201);

  return (await response.json()) as ApiResponse<{
    order: { id: string; orderCode: string; status: string; subtotal: number };
  }>;
}

export function createOrderPayload(
  customer: TestCustomer,
  book: TestBook,
  quantity = 1,
  checkoutAttemptId = crypto.randomUUID(),
) {
  return {
    checkoutAttemptId,
    customerEmail: customer.email,
    customerName: "CaseFlow Customer QA",
    customerPhone: "+84 912 345 678",
    items: [{ productId: book.edition.id, quantity }],
    paymentMethod: "cod",
    shippingAddress: createShippingAddress("CaseFlow Customer QA"),
    shippingMethod: "standard",
  };
}

export async function deleteOrdersByCustomerEmail(email: string) {
  const service = createTestServiceClient();
  const { error } = await service
    .from("orders")
    .delete()
    .eq("customer_email", email);

  if (error) {
    throw error;
  }
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;

    return documentElement.scrollWidth - documentElement.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

export async function fillField(page: Page, selector: string, value: string) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 20_000 });
  await page.locator(selector).evaluate(
    (element, nextValue) => {
      const field = element as HTMLInputElement | HTMLTextAreaElement;
      const prototype =
        field instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

      field.focus();
      valueSetter?.call(field, nextValue);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
}

export async function clickElement(page: Page, selector: string) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 20_000 });
  await page.locator(selector).evaluate((element) =>
    (element as HTMLButtonElement | HTMLAnchorElement).click(),
  );
}

export async function clickFirstVisible(page: Page, selector: string) {
  await page.waitForFunction((targetSelector) => {
    return Array.from(document.querySelectorAll(targetSelector)).some(
      (element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      },
    );
  }, selector);
  await page.evaluate((targetSelector) => {
    const element = Array.from(document.querySelectorAll(targetSelector)).find(
      (candidate) => {
        const rect = candidate.getBoundingClientRect();
        const style = window.getComputedStyle(candidate);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      },
    );

    if (!element) {
      throw new Error(`No visible element found for ${targetSelector}`);
    }

    (element as HTMLButtonElement | HTMLAnchorElement).click();
  }, selector);
}

export async function selectFieldOption(
  page: Page,
  selector: string,
  value: string,
) {
  await page.locator(selector).waitFor({ state: "visible", timeout: 20_000 });
  await page.locator(selector).evaluate(
    (element, nextValue) => {
      const field = element as HTMLSelectElement;

      field.value = nextValue;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
}

function createShippingAddress(recipientName: string) {
  return {
    countryCode: "VN",
    district: "District 1",
    line1: "12 Nguyen Hue",
    line2: null,
    phone: "+84 912 345 678",
    province: "Ho Chi Minh City",
    recipientName,
    ward: "Ben Nghe",
  };
}

function requireEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }

  return value;
}

function getPlaywrightBaseURL() {
  const explicitBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();

  if (explicitBaseURL) {
    return explicitBaseURL.replace(/\/$/, "");
  }

  const port = process.env.PLAYWRIGHT_PORT?.trim() || "3001";

  return `http://127.0.0.1:${port}`;
}
