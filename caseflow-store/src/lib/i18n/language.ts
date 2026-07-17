export const SUPPORTED_LANGUAGES = ["en", "vi"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type LocalizedText = Partial<Record<Language, string>>;

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_COOKIE = "caseflow-books.language";
export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseLanguage(value: string | null | undefined): Language {
  return SUPPORTED_LANGUAGES.includes(value as Language)
    ? (value as Language)
    : DEFAULT_LANGUAGE;
}

export function pickLocalizedText(
  value: LocalizedText | null | undefined,
  language: Language,
  fallback = "",
) {
  return value?.[language] ?? value?.[DEFAULT_LANGUAGE] ?? fallback;
}

export function getLanguageName(language: Language) {
  return language === "vi" ? "Tiếng Việt" : "English";
}

export function getEditionLanguageLabel(
  editionLanguage: Language,
  currentLanguage: Language,
) {
  if (currentLanguage === "vi") {
    return editionLanguage === "vi" ? "Tiếng Việt" : "Tiếng Anh";
  }

  return editionLanguage === "vi" ? "Vietnamese" : "English";
}
