import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { expect, type BrowserContext, type Page } from "@playwright/test";

import type { Database } from "@/types/supabase";

type TestCustomer = {
  id: string;
  email: string;
  password: string;
};

type CapturedCookie = {
  name: string;
  value: string;
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

  await page.goto("/admin/login");
  await page.locator("[data-admin-login-email]").fill(credentials.email);
  await page.locator("[data-admin-login-password]").fill(credentials.password);
  await page.locator("[data-admin-login-submit]").click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.locator("[data-admin-orders-page]")).toBeVisible();
}

export async function createTemporaryCustomer(): Promise<TestCustomer> {
  const service = createTestServiceClient();
  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const email = `caseflow.customer.${suffix}@example.com`;
  const password = `Customer-${crypto.randomUUID()}-9a`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "CaseFlow Customer QA" },
  });

  if (error) {
    throw error;
  }

  const { error: profileError } = await service.from("profiles").upsert({
    id: data.user.id,
    display_name: "CaseFlow Customer QA",
    role: "customer",
  });

  if (profileError) {
    await service.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }

  return { id: data.user.id, email, password };
}

export async function deleteTemporaryCustomer(customer: TestCustomer) {
  const service = createTestServiceClient();
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

export async function deleteOrdersByCustomerEmail(email: string) {
  const service = createTestServiceClient();
  const { error } = await service.from("orders").delete().eq("customer_email", email);

  if (error) {
    throw error;
  }
}

function requireEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }

  return value;
}
