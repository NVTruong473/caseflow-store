import { expect, test } from "@playwright/test";

import {
  addSupabaseSessionCookies,
  createTemporaryCustomer,
  createTestPublicClient,
  createTestServiceClient,
  deleteTemporaryCustomer,
  type TestCustomer,
} from "./helpers/supabase";

const NEW_CUSTOMER_PASSWORD = "CaseFlow-Recovered-2026!";

test("customer password change requires a single-use email recovery link and rejects the old endpoint", async ({
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
    await page.goto("/account", { waitUntil: "domcontentloaded" });

    await expect(page.locator("[data-customer-password-form]"))
      .toHaveAttribute(
        "data-password-assurance",
        "email-recovery-link",
      );
    await expect(
      page.locator("[data-customer-password-code-request]"),
    ).toBeVisible();
    await expect(page.locator("[data-customer-password-otp]")).toHaveCount(0);
    await expect(page.locator("[data-customer-password-new]")).toHaveCount(0);
    await expect(
      page.locator("[data-customer-password-current]"),
    ).toHaveCount(0);
    await expect(
      page.locator("[data-operations-password-secret]"),
    ).toHaveCount(0);

    const oldFlowResponse = await page.request.patch(
      "/api/customer/password",
      {
        data: {
          confirmPassword: NEW_CUSTOMER_PASSWORD,
          currentPassword: customer.password,
          newPassword: NEW_CUSTOMER_PASSWORD,
        },
      },
    );
    expect(oldFlowResponse.status()).toBe(403);

    const recoveryLink = await generateRecoveryLink(customer, baseURL!);
    await page.goto(recoveryLink, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/account\/password-reset/);
    await expect(
      page.locator("[data-customer-password-recovery-form]"),
    ).toBeVisible();
    expect(page.url()).not.toContain("access_token");
    expect(page.url()).not.toContain("refresh_token");

    await page
      .locator("[data-customer-password-recovery-new]")
      .fill(NEW_CUSTOMER_PASSWORD);
    await page
      .locator("[data-customer-password-recovery-confirm]")
      .fill(NEW_CUSTOMER_PASSWORD);
    await page.locator("[data-customer-password-recovery-submit]").click();
    await expect(
      page.locator("[data-customer-password-reset-complete]"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/account\?passwordChanged=1$/);
    await expect(page.locator("[data-customer-account-panel]")).toHaveCount(0);

    const publicClient = createTestPublicClient();
    const oldLogin = await publicClient.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(oldLogin.error).toBeTruthy();
    const newLogin = await publicClient.auth.signInWithPassword({
      email: customer.email,
      password: NEW_CUSTOMER_PASSWORD,
    });
    expect(newLogin.error).toBeNull();
    await publicClient.auth.signOut();

    await page.screenshot({
      fullPage: false,
      path: ".agent/artifacts/auth-pass-t02/customer-email-recovery-success.png",
    });
  } finally {
    await deleteTemporaryCustomer(customer);
  }
});

for (const role of ["admin", "staff"] as const) {
  test(`${role} password change requires current password and the server-managed operations key`, async ({
    baseURL,
    context,
    page,
  }) => {
    expect(baseURL).toBeTruthy();
    const operationsSecret =
      process.env.OPERATIONS_PASSWORD_CHANGE_SECRET?.trim();
    expect(operationsSecret?.length).toBeGreaterThanOrEqual(6);
    const account = await createTemporaryOperationsUser(role);
    const newPassword = `CaseFlow-${role}-Changed-2026!`;

    try {
      await addSupabaseSessionCookies(
        context,
        baseURL!,
        account.email,
        account.password,
      );
      await page.goto("/account", { waitUntil: "domcontentloaded" });
      await expect(page.locator("[data-customer-password-form]"))
        .toHaveAttribute("data-password-assurance", "operations-secret");
      await expect(
        page.locator("[data-operations-password-secret]"),
      ).toBeVisible();
      await expect(
        page.locator("[data-customer-password-code-request]"),
      ).toHaveCount(0);
      await expect(page.locator("[data-customer-password-otp]")).toHaveCount(0);
      const pageText = await page.locator("body").innerText();
      expect(pageText).not.toContain(operationsSecret!);

      await page
        .locator("[data-customer-password-current]")
        .fill(account.password);
      await page
        .locator("[data-operations-password-secret]")
        .fill(`invalid-${crypto.randomUUID()}`);
      await page.locator("[data-customer-password-new]").fill(newPassword);
      await page
        .locator("[data-customer-password-confirm]")
        .fill(newPassword);
      await page.locator("[data-customer-password-submit]").click();
      await expect(page.locator("[data-customer-password-error]")).toBeVisible();

      await page
        .locator("[data-operations-password-secret]")
        .fill(operationsSecret!);
      await page.locator("[data-customer-password-submit]").click();
      await expect(
        page.locator("[data-customer-password-success]"),
      ).toBeVisible();

      const publicClient = createTestPublicClient();
      const oldLogin = await publicClient.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });
      expect(oldLogin.error).toBeTruthy();
      const newLogin = await publicClient.auth.signInWithPassword({
        email: account.email,
        password: newPassword,
      });
      expect(newLogin.error).toBeNull();
      await publicClient.auth.signOut();
    } finally {
      await deleteTemporaryOperationsUser(account);
    }
  });
}

async function generateRecoveryLink(customer: TestCustomer, baseURL: string) {
  const service = createTestServiceClient();
  const { data, error } = await service.auth.admin.generateLink({
    email: customer.email,
    options: {
      redirectTo: `${baseURL}/account/password-reset`,
    },
    type: "recovery",
  });

  if (error || !data.properties.action_link) {
    throw new Error("Could not generate a recovery link for the test account");
  }

  return data.properties.action_link;
}

async function createTemporaryOperationsUser(role: "admin" | "staff") {
  const service = createTestServiceClient();
  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const email = `caseflow.${role}.${suffix}@example.com`;
  const password = `CaseFlow-${role}-${crypto.randomUUID()}!`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
  });

  if (error || !data.user) {
    throw error ?? new Error("Operations test user was not created");
  }

  const now = new Date().toISOString();
  const { error: profileError } = await service.from("profiles").upsert(
    {
      display_name: `CaseFlow ${role} QA`,
      email,
      email_verified_at: now,
      full_name: `CaseFlow ${role} QA`,
      id: data.user.id,
      role,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await service.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }

  return { email, id: data.user.id, password };
}

async function deleteTemporaryOperationsUser(account: {
  id: string;
}) {
  const service = createTestServiceClient();
  const { error } = await service.auth.admin.deleteUser(account.id);

  if (error) {
    throw error;
  }
}
