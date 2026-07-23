import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { storefrontConfig } from "@/config/storefront";
import {
  toAdminInventoryAdjustmentApiItem,
  toAdminInventoryEditionApiItem,
} from "@/lib/api/admin-inventory";
import { AdminInventoryPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import {
  listSupabaseAdminBookCatalog,
  listSupabaseAdminInventoryAdjustments,
} from "@/lib/repositories/supabase-books";

export const metadata: Metadata = {
  title: `Inventory operations | ${storefrontConfig.name}`,
  description: `Inventory operations shell for ${storefrontConfig.name}.`,
};

export default async function AdminInventoryRoute() {
  const language = await getRequestLanguage();
  const auth = await requireAdminPermission("inventory:adjust");

  if (!auth.authorized) {
    redirect(`/admin/login?reason=${auth.code.toLowerCase()}`);
  }

  const [records, adjustments] = await Promise.all([
    listSupabaseAdminBookCatalog({ sort: "stock-asc" }),
    listSupabaseAdminInventoryAdjustments({ limit: 20 }),
  ]);

  return (
    <AdminInventoryPage
      adminName={auth.user.displayName}
      adminPermissions={auth.user.permissions}
      adminRole={auth.user.role}
      initialAdjustments={adjustments.map(toAdminInventoryAdjustmentApiItem)}
      initialItems={records.map(toAdminInventoryEditionApiItem)}
      language={language}
    />
  );
}
