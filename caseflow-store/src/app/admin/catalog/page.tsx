import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  createAdminBookCatalogOperationsContext,
  toAdminBookEditionApiItem,
  toAdminBookWorkOptions,
} from "@/lib/api/admin-book-catalog";
import { storefrontConfig } from "@/config/storefront";
import { toAdminMerchandisingShelfApiItems } from "@/lib/api/admin-merchandising";
import { AdminCatalogPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import { listSupabaseAdminBookCatalog } from "@/lib/repositories/supabase-books";
import { listSupabaseAdminContentQualitySummaries } from "@/lib/repositories/supabase-content-operations";
import {
  listSupabaseMerchandisingShelves,
  resolveSupabaseMerchandisingShelves,
} from "@/lib/repositories/supabase-merchandising";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: `Catalog operations | ${storefrontConfig.name}`,
  description: `Catalog operations shell for ${storefrontConfig.name}.`,
};

export default async function AdminCatalogRoute() {
  const language = await getRequestLanguage();
  const auth = await requireAdminPermission("catalog:manage");

  if (!auth.authorized) {
    redirect(`/admin/login?reason=${auth.code.toLowerCase()}`);
  }

  const records = await listSupabaseAdminBookCatalog({ sort: "title-asc" });
  const [contentQualityByEditionId, merchandisingShelves] = await Promise.all([
    listSupabaseAdminContentQualitySummaries(
      records.map((record) => record.edition.id),
    ),
    listSupabaseMerchandisingShelves({
      client: createSupabaseAdminClient(),
    }),
  ]);
  const resolvedShelves = resolveSupabaseMerchandisingShelves(
    records,
    merchandisingShelves,
  );
  const operationsContext = createAdminBookCatalogOperationsContext({
    contentQualityByEditionId,
    resolvedShelves,
  });

  return (
    <AdminCatalogPage
      adminName={auth.user.displayName}
      adminPermissions={auth.user.permissions}
      adminRole={auth.user.role}
      initialEditions={records.map((record) =>
        toAdminBookEditionApiItem(record, operationsContext),
      )}
      initialMerchandisingShelves={toAdminMerchandisingShelfApiItems(
        resolvedShelves,
      )}
      initialWorkOptions={toAdminBookWorkOptions(records)}
      language={language}
    />
  );
}
