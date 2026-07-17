import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboardPage } from "@/features/admin";
import { requireAdminPermission } from "@/lib/auth/admin";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getSupabaseAdminDashboard } from "@/lib/repositories/supabase-dashboard";
import { adminDashboardQuerySchema } from "@/lib/validation/dashboard";

export const metadata: Metadata = {
  title: "Operations dashboard | CaseFlow Books",
  description: "Sales and inventory dashboard for CaseFlow Books.",
};

type AdminDashboardRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboardRoute({
  searchParams,
}: AdminDashboardRouteProps) {
  const language = await getRequestLanguage();
  const auth = await requireAdminPermission("orders:read");

  if (!auth.authorized) {
    redirect(`/admin/login?reason=${auth.code.toLowerCase()}`);
  }

  const params = await searchParams;
  const parsedQuery = adminDashboardQuerySchema.safeParse({
    from: getParamValue(params?.from),
    range: getParamValue(params?.range),
    to: getParamValue(params?.to),
  });
  const dashboard = await getSupabaseAdminDashboard(
    parsedQuery.success ? parsedQuery.data : {},
  );

  return (
    <AdminDashboardPage
      dashboard={dashboard}
      language={language}
      permissions={auth.user.permissions}
      role={auth.user.role}
      userName={auth.user.displayName}
    />
  );
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
