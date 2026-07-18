import type { Metadata } from "next";

import type { Language } from "@/lib/i18n/language";

const DEFAULT_SITE_URL = "https://caseflow-store.vercel.app";
const SITE_NAME = "CaseFlow Books";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    return new URL(configuredUrl || DEFAULT_SITE_URL);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
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
  const normalizedDescription = truncateDescription(description);
  const image = imagePath
    ? {
        alt: imageAlt ?? title,
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
      siteName: SITE_NAME,
      title,
      type: "website",
      url,
      ...(image ? { images: [image] } : {}),
    },
    robots,
    title,
    twitter: {
      card: image ? "summary_large_image" : "summary",
      description: normalizedDescription,
      ...(image ? { images: [image.url] } : {}),
      title,
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
