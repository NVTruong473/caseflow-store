import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Operations login | CaseFlow Books",
  description: "Staff and admin access check for CaseFlow Books operations.",
};

export default async function AdminLoginRoute() {
  const language = await getRequestLanguage();
  const adminAuth = await requireAdminPermission("orders:read");

  if (adminAuth.authorized) {
    redirect("/admin/orders");
  }

  return <AdminLoginPage language={language} />;
}
