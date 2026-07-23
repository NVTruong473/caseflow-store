import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { storefrontConfig } from "@/config/storefront";
import { CustomerOrdersPage } from "@/features/customer";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { getRequestLanguage } from "@/lib/i18n/server";
import { listSupabaseOrdersForCustomer } from "@/lib/repositories/supabase-orders";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? `Xem lịch sử đơn hàng ${storefrontConfig.name} của tài khoản khách hàng đã đăng nhập.`
        : `View ${storefrontConfig.name} order history for the signed-in customer account.`,
    language,
    path: "/account/orders",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi"
        ? `Lịch sử đơn hàng - ${storefrontConfig.name}`
        : `Order history - ${storefrontConfig.name}`,
  });
}

export default async function CustomerOrdersRoute() {
  const language = await getRequestLanguage();
  const authState = await getCustomerAuthState();

  if (
    authState.status !== "authenticated" ||
    authState.user.role !== "customer"
  ) {
    redirect("/account?next=/account/orders");
  }

  const records = await listSupabaseOrdersForCustomer(authState.user.id);

  return <CustomerOrdersPage language={language} records={records} />;
}
