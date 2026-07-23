import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { storefrontConfig } from "@/config/storefront";
import { AdminPromotionsPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import { listSupabaseAdminBookPromotions } from "@/lib/repositories/supabase-promotions";
import { toAdminPromotionApiItem } from "@/lib/api/admin-promotions";

export const metadata: Metadata = {
  title: `Promotion operations | ${storefrontConfig.name}`,
  description: `Promotion operations shell for ${storefrontConfig.name}.`,
};

export default async function AdminPromotionsRoute() {
  const language = await getRequestLanguage();
  const auth = await requireAdminPermission("promotions:manage");

  if (!auth.authorized) {
    redirect(`/admin/login?reason=${auth.code.toLowerCase()}`);
  }

  const promotions = await listSupabaseAdminBookPromotions();

  return (
    <AdminPromotionsPage
      adminName={auth.user.displayName}
      adminPermissions={auth.user.permissions}
      adminRole={auth.user.role}
      initialPromotions={promotions.map(toAdminPromotionApiItem)}
      language={language}
    />
  );
}
