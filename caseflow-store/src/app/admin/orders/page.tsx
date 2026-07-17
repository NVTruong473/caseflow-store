import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminOrdersPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Operations orders | CaseFlow Books",
  description: "Staff and admin order list for CaseFlow Books.",
};

export default async function AdminOrdersRoute() {
  const language = await getRequestLanguage();
  const adminAuth = await requireAdminPermission("orders:read");

  if (!adminAuth.authorized) {
    redirect(`/admin/login?reason=${adminAuth.code.toLowerCase()}`);
  }

  return (
    <AdminOrdersPage
      adminPermissions={adminAuth.user.permissions}
      adminName={adminAuth.user.displayName}
      adminRole={adminAuth.user.role}
      language={language}
    />
  );
}
