import type { Metadata } from "next";

import { storefrontConfig } from "@/config/storefront";
import { BookstorePolicyPage } from "@/features/policies/bookstore-policy-page";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getBookstorePolicy } from "@/lib/policies/bookstore-policies";
import { createPageMetadata } from "@/lib/seo/metadata";

const policy = getBookstorePolicy("contact");

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const copy = policy.copy[language];

  return createPageMetadata({
    description: copy.summary,
    language,
    path: policy.path,
    title: `${copy.title} - ${storefrontConfig.name}`,
  });
}

export default async function ContactPage() {
  const language = await getRequestLanguage();

  return <BookstorePolicyPage language={language} policy={policy} />;
}
