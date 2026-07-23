import type { Metadata } from "next";

import { storefrontConfig } from "@/config/storefront";
import { CustomerAuthPage } from "@/features/customer";
import { getCustomerAuthState } from "@/lib/auth/customer";
import { getRequestLanguage } from "@/lib/i18n/server";
import {
  ensureCustomerSignupVouchers,
  listCustomerSignupVouchers,
} from "@/lib/repositories/supabase-customer-vouchers";
import { createPageMetadata } from "@/lib/seo/metadata";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? `Đăng nhập hoặc tạo tài khoản ${storefrontConfig.name} để hoàn tất hồ sơ, địa chỉ giao hàng và xem đơn hàng.`
        : `Sign in or create a ${storefrontConfig.name} account to complete your profile, shipping address, and order access.`,
    language,
    path: "/account",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi"
        ? `Tài khoản - ${storefrontConfig.name}`
        : `Customer account - ${storefrontConfig.name}`,
  });
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const language = await getRequestLanguage();
  const params = await searchParams;
  const authState = await getCustomerAuthState();
  const nextPath = normalizeNextPath(params?.next);
  const signupVouchers =
    authState.status === "authenticated" && authState.user.role === "customer"
      ? await ensureAndListCustomerSignupVouchers(authState.user.id)
      : [];

  return (
    <CustomerAuthPage
      authState={authState}
      language={language}
      nextPath={nextPath}
      signupVouchers={signupVouchers}
    />
  );
}

async function ensureAndListCustomerSignupVouchers(customerId: string) {
  const currentVouchers = await listCustomerSignupVouchers(customerId);

  if (currentVouchers.length > 0) {
    return currentVouchers;
  }

  return ensureCustomerSignupVouchers(customerId);
}

function normalizeNextPath(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue || !rawValue.startsWith("/") || rawValue.startsWith("//")) {
    return null;
  }

  return rawValue;
}
