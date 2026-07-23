import type { Metadata } from "next";

import { storefrontConfig } from "@/config/storefront";
import { CheckoutSuccessPage } from "@/features/checkout";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? `Xác nhận đặt hàng ${storefrontConfig.name} trên trình duyệt hiện tại.`
        : `${storefrontConfig.name} order confirmation for the current browser session.`,
    language,
    path: "/checkout/success",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi"
        ? `Đã đặt hàng - ${storefrontConfig.name}`
        : `Order placed - ${storefrontConfig.name}`,
  });
}

export default async function CheckoutSuccessRoute() {
  const language = await getRequestLanguage();

  return <CheckoutSuccessPage language={language} />;
}
