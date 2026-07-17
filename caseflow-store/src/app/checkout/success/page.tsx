import type { Metadata } from "next";

import { CheckoutSuccessPage } from "@/features/checkout";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? "Xác nhận đặt hàng CaseFlow Books trên trình duyệt hiện tại."
        : "CaseFlow Books order confirmation for the current browser session.",
    language,
    path: "/checkout/success",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi"
        ? "Đã đặt hàng - CaseFlow Books"
        : "Order placed - CaseFlow Books",
  });
}

export default async function CheckoutSuccessRoute() {
  const language = await getRequestLanguage();

  return <CheckoutSuccessPage language={language} />;
}
