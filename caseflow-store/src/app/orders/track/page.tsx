import type { Metadata } from "next";

import { OrderTrackingPage } from "@/features/orders";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? "Tra cứu đơn CaseFlow Books bằng mã đơn và email hoặc số điện thoại khớp với đơn hàng."
        : "Track a CaseFlow Books order with an order code and matching email or phone contact.",
    language,
    path: "/orders/track",
    title:
      language === "vi"
        ? "Tra cứu đơn hàng - CaseFlow Books"
        : "Track order - CaseFlow Books",
  });
}

export default async function OrderTrackingRoute() {
  const language = await getRequestLanguage();

  return <OrderTrackingPage language={language} />;
}
