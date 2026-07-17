import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutPage } from "@/features/checkout";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { getCurrencyDisplayRules } from "@/lib/format/currency-display.server";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? "Checkout CaseFlow Books yêu cầu đăng nhập, hồ sơ khách hàng đầy đủ, địa chỉ giao hàng và tổng tiền do server tính lại."
        : "CaseFlow Books checkout requires sign-in, a complete customer profile, shipping details, and server-recalculated totals.",
    language,
    path: "/checkout",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi"
        ? "Thanh toán - CaseFlow Books"
        : "Checkout - CaseFlow Books",
  });
}

export default async function CheckoutRoute() {
  const language = await getRequestLanguage();
  const currencyRules = getCurrencyDisplayRules();
  const customerAuthState = await getCustomerAuthState();

  if (
    customerAuthState.status !== "authenticated" ||
    customerAuthState.user.role !== "customer"
  ) {
    redirect("/account?next=/checkout");
  }

  return (
    <CheckoutPage
      currencyRules={currencyRules}
      customerAuthState={customerAuthState}
      language={language}
    />
  );
}
