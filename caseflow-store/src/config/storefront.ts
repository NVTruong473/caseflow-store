import type { Language } from "@/lib/i18n/language";

export const REFERENCE_STORE_NAME = "CaseFlow Books";
export const REFERENCE_SITE_URL = "https://caseflow-store.vercel.app";

type LocalizedValue = Record<Language, string>;

export type StorefrontConfig = {
  canonicalUrl: string;
  copyrightYear: number;
  legalDisplayName: string;
  name: string;
  shortMark: string;
  supportEmail: string | null;
  supportHours: LocalizedValue;
  supportPhone: string | null;
  tagline: LocalizedValue;
};

const name =
  nonEmptyValue(process.env.NEXT_PUBLIC_STORE_NAME) ?? REFERENCE_STORE_NAME;

export const storefrontConfig: Readonly<StorefrontConfig> = Object.freeze({
  canonicalUrl: validHttpUrl(process.env.NEXT_PUBLIC_SITE_URL),
  copyrightYear: integerValue(
    process.env.NEXT_PUBLIC_STORE_COPYRIGHT_YEAR,
    new Date().getUTCFullYear(),
    2020,
    2100,
  ),
  legalDisplayName:
    nonEmptyValue(process.env.NEXT_PUBLIC_STORE_LEGAL_NAME) ?? name,
  name,
  shortMark:
    normalizedShortMark(process.env.NEXT_PUBLIC_STORE_SHORT_MARK) ??
    deriveShortMark(name),
  supportEmail: validEmail(process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL),
  supportHours: {
    en:
      nonEmptyValue(process.env.NEXT_PUBLIC_STORE_SUPPORT_HOURS_EN) ??
      "Mon-Sat, 09:00-18:00 ICT",
    vi:
      nonEmptyValue(process.env.NEXT_PUBLIC_STORE_SUPPORT_HOURS_VI) ??
      "Thứ 2-Thứ 7, 09:00-18:00 ICT",
  },
  supportPhone: validPhone(process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE),
  tagline: {
    en:
      nonEmptyValue(process.env.NEXT_PUBLIC_STORE_TAGLINE_EN) ??
      "Bilingual bookstore",
    vi:
      nonEmptyValue(process.env.NEXT_PUBLIC_STORE_TAGLINE_VI) ??
      "Nhà sách song ngữ",
  },
});

export function withStorefrontBrand(value: string) {
  return value.replace(
    /CaseFlow Books|\bCaseFlow\b/g,
    storefrontConfig.name,
  );
}

function nonEmptyValue(value: string | undefined) {
  const normalized = value?.trim();

  return normalized || null;
}

function validHttpUrl(value: string | undefined) {
  const normalized = nonEmptyValue(value) ?? REFERENCE_SITE_URL;

  try {
    const url = new URL(normalized);

    if (!["http:", "https:"].includes(url.protocol)) {
      return REFERENCE_SITE_URL;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return REFERENCE_SITE_URL;
  }
}

function validEmail(value: string | undefined) {
  const normalized = nonEmptyValue(value)?.toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function validPhone(value: string | undefined) {
  const normalized = nonEmptyValue(value);
  const digits = normalized?.replace(/\D/g, "") ?? "";

  if (!normalized || digits.length < 8 || digits.length > 15) {
    return null;
  }

  return normalized;
}

function normalizedShortMark(value: string | undefined) {
  const normalized = nonEmptyValue(value)
    ?.replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4);

  return normalized || null;
}

function deriveShortMark(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3);

  return initials || "SHOP";
}

function integerValue(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number.parseInt(value?.trim() ?? "", 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}
