import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminOrdersPage } from "@/features/admin";
import { requireAdminRequest } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Admin orders | CaseFlow Store",
  description: "Admin order list for CaseFlow Store.",
};

export default async function AdminOrdersRoute() {
  const adminAuth = await requireAdminRequest();

  if (!adminAuth.authorized) {
    redirect(`/admin/login?reason=${adminAuth.code.toLowerCase()}`);
  }

  return <AdminOrdersPage adminName={adminAuth.user.displayName} />;
}
