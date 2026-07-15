import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginPage } from "@/features/admin";
import { requireAdminRequest } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Admin login | CaseFlow Store",
  description: "Admin access check for CaseFlow Store order management.",
};

export default async function AdminLoginRoute() {
  const adminAuth = await requireAdminRequest();

  if (adminAuth.authorized) {
    redirect("/admin/orders");
  }

  return <AdminLoginPage />;
}
