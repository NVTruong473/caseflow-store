import type { Metadata } from "next";

import { storefrontConfig } from "@/config/storefront";
import { CustomerPasswordRecoveryPage } from "@/features/customer";
import { getRequestLanguage } from "@/lib/i18n/server";
import { createPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();

  return createPageMetadata({
    description:
      language === "vi"
        ? `Đặt mật khẩu mới cho tài khoản ${storefrontConfig.name} bằng liên kết bảo mật trong email.`
        : `Set a new ${storefrontConfig.name} account password from the secure email link.`,
    language,
    path: "/account/password-reset",
    robots: {
      follow: false,
      index: false,
    },
    title:
      language === "vi" ? "Đặt mật khẩu mới" : "Set a new password",
  });
}

export default async function PasswordResetPage() {
  const language = await getRequestLanguage();

  return <CustomerPasswordRecoveryPage language={language} />;
}
