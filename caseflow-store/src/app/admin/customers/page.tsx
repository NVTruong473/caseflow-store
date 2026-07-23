import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { storefrontConfig } from "@/config/storefront";
import { AdminCustomersPage } from "@/features/admin";
import { toAdminCustomerApiItem } from "@/lib/api/admin-customers";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import { listSupabaseAdminCustomers } from "@/lib/repositories/supabase-customers";

export const metadata: Metadata = {
  title: `Customer operations | ${storefrontConfig.name}`,
  description: `Customer operations shell for ${storefrontConfig.name}.`,
};

export default async function AdminCustomersRoute() {
  const language = await getRequestLanguage();
  const auth = await requireAdminPermission("orders:read");

  if (!auth.authorized) {
    redirect(`/admin/login?reason=${auth.code.toLowerCase()}`);
  }

  const customers = await listSupabaseAdminCustomers();

  return (
    <AdminCustomersPage
      adminName={auth.user.displayName}
      adminPermissions={auth.user.permissions}
      adminRole={auth.user.role}
      initialCustomers={customers.map(toAdminCustomerApiItem)}
      language={language}
    />
  );
}
