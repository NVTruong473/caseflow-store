import type { Metadata } from "next";

import { storefrontConfig } from "@/config/storefront";
import { TransferExperiencePage } from "@/features/checkout";
import { getRequestLanguage } from "@/lib/i18n/server";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: `QR Experience | ${storefrontConfig.name}`,
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const [requestLanguage, params] = await Promise.all([
    getRequestLanguage(),
    searchParams,
  ]);
  const language =
    params.lang === "en" || params.lang === "vi"
      ? params.lang
      : requestLanguage;

  return <TransferExperiencePage language={language} />;
}
