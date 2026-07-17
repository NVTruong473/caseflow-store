import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  toAdminBookEditionApiItem,
  toAdminBookWorkOptions,
} from "@/lib/api/admin-book-catalog";
import { AdminCatalogPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import { listSupabaseAdminBookCatalog } from "@/lib/repositories/supabase-books";

export const metadata: Metadata = {
  title: "Catalog operations | CaseFlow Books",
  description: "Catalog operations shell for CaseFlow Books.",
};

export default async function AdminCatalogRoute() {
  const language = await getRequestLanguage();
  const auth = await requireAdminPermission("catalog:manage");

  if (!auth.authorized) {
    redirect(`/admin/login?reason=${auth.code.toLowerCase()}`);
  }

  const records = await listSupabaseAdminBookCatalog({ sort: "title-asc" });

  return (
    <AdminCatalogPage
      adminName={auth.user.displayName}
      adminPermissions={auth.user.permissions}
      adminRole={auth.user.role}
      initialEditions={records.map(toAdminBookEditionApiItem)}
      initialWorkOptions={toAdminBookWorkOptions(records)}
      language={language}
    />
  );
}
