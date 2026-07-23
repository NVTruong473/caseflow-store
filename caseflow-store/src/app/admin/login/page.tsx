import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { storefrontConfig } from "@/config/storefront";
import { AdminLoginPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: `Operations login | ${storefrontConfig.name}`,
  description: `Staff and admin access check for ${storefrontConfig.name} operations.`,
};

export default async function AdminLoginRoute() {
  const language = await getRequestLanguage();
  const adminAuth = await requireAdminPermission("orders:read");

  if (adminAuth.authorized) {
    redirect("/admin/orders");
  }

  return <AdminLoginPage language={language} />;
}
