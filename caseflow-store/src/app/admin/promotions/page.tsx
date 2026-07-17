import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminPromotionsPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import { listSupabaseAdminBookPromotions } from "@/lib/repositories/supabase-promotions";
import { toAdminPromotionApiItem } from "@/lib/api/admin-promotions";

export const metadata: Metadata = {
  title: "Promotion operations | CaseFlow Books",
  description: "Promotion operations shell for CaseFlow Books.",
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
