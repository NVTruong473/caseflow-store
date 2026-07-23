import type { Metadata } from "next";

import { storefrontConfig } from "@/config/storefront";
import { OrderTrackingPage } from "@/features/orders";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? `Tra cứu đơn ${storefrontConfig.name} bằng mã đơn và email hoặc số điện thoại khớp với đơn hàng.`
        : `Track a ${storefrontConfig.name} order with an order code and matching email or phone contact.`,
    language,
    path: "/orders/track",
    title:
      language === "vi"
        ? `Tra cứu đơn hàng - ${storefrontConfig.name}`
        : `Track order - ${storefrontConfig.name}`,
  });
}

export default async function OrderTrackingRoute() {
  const language = await getRequestLanguage();

  return <OrderTrackingPage language={language} />;
}
