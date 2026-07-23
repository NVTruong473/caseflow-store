import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { storefrontConfig } from "@/config/storefront";
import { CheckoutPage } from "@/features/checkout";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getDemoPaymentConfig } from "@/lib/payments/config";
import {
  ensureCustomerSignupVouchers,
  listCustomerSignupVouchers,
} from "@/lib/repositories/supabase-customer-vouchers";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? `Thanh toán ${storefrontConfig.name} yêu cầu đăng nhập, hồ sơ khách hàng đầy đủ, địa chỉ giao hàng và tổng tiền được cửa hàng tính lại.`
        : `${storefrontConfig.name} checkout requires sign-in, a complete customer profile, shipping details, and store-recalculated totals.`,
    language,
    path: "/checkout",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi"
        ? `Thanh toán - ${storefrontConfig.name}`
        : `Checkout - ${storefrontConfig.name}`,
  });
}

export default async function CheckoutRoute() {
  const language = await getRequestLanguage();
  const currencyRules = getCurrencyDisplayRules();
  const customerAuthState = await getCustomerAuthState();
  const paymentConfig = getDemoPaymentConfig();

  if (
    customerAuthState.status !== "authenticated" ||
    customerAuthState.user.role !== "customer"
  ) {
    redirect("/account?next=/checkout");
  }

  const signupVouchers = await ensureAndListCustomerSignupVouchers(
    customerAuthState.user.id,
  );

  return (
    <CheckoutPage
      currencyRules={currencyRules}
      customerAuthState={customerAuthState}
      language={language}
      qrDemoPaymentsEnabled={paymentConfig.allowQrDemoPayments}
      signupVouchers={signupVouchers}
    />
  );
}

async function ensureAndListCustomerSignupVouchers(customerId: string) {
  const currentVouchers = await listCustomerSignupVouchers(customerId);

  if (currentVouchers.length > 0) {
    return currentVouchers;
  }

  return ensureCustomerSignupVouchers(customerId);
}
