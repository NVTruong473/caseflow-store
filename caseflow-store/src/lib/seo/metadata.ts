import type { Metadata } from "next";

import {
  storefrontConfig,
  withStorefrontBrand,
} from "@/config/storefront";
import type { Language } from "@/lib/i18n/language";

export function getSiteUrl() {
  return new URL(storefrontConfig.canonicalUrl);
}

export function absoluteUrl(pathname = "/") {
  return new URL(pathname, getSiteUrl()).toString();
}

export function createPageMetadata({
  description,
  imageAlt,
  imagePath,
  language,
  path,
  robots,
  title,
}: {
  description: string;
  imageAlt?: string | null;
  imagePath?: string | null;
  language: Language;
  path: string;
  robots?: Metadata["robots"];
  title: string;
}): Metadata {
  const url = absoluteUrl(path);
  const brandedTitle = withStorefrontBrand(title);
  const normalizedDescription = truncateDescription(
    withStorefrontBrand(description),
  );
  const image = imagePath
    ? {
        alt: withStorefrontBrand(imageAlt ?? brandedTitle),
        url: absoluteUrl(imagePath),
      }
    : null;

  return {
    alternates: {
      canonical: url,
    },
    description: normalizedDescription,
    openGraph: {
      description: normalizedDescription,
      locale: language === "vi" ? "vi_VN" : "en_US",
      siteName: storefrontConfig.name,
      title: brandedTitle,
      type: "website",
      url,
      ...(image ? { images: [image] } : {}),
    },
    robots,
    title: brandedTitle,
    twitter: {
      card: image ? "summary_large_image" : "summary",
      description: normalizedDescription,
      ...(image ? { images: [image.url] } : {}),
      title: brandedTitle,
    },
  };
}

export function truncateDescription(value: string, maxLength = 160) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
