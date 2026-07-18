import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  bookAuthors,
  bookEditions,
  bookWorks,
} from "@/data/books/seed";

const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const CHECKED_AT = "2026-07-17T00:00:00.000Z";
const REQUEST_DELAY_MS = 375;
const OUTPUT_PATH = path.join(
  process.cwd(),
  ".agent/artifacts/v12-t05/open-library-edition-candidates.json",
);

type OpenLibraryEdition = {
  key?: string;
  title?: string;
  subtitle?: string;
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  physical_format?: string;
  isbn_10?: string[];
  isbn_13?: string[];
  languages?: Array<{ key?: string }>;
  by_statement?: string;
  weight?: string;
  physical_dimensions?: string;
};

type OpenLibrarySearchDocument = {
  key?: string;
  title?: string;
  author_name?: string[];
  edition_key?: string[];
  editions?: {
    docs?: Array<{ key?: string }>;
  };
};

type OpenLibrarySearchResponse = {
  numFound?: number;
  docs?: OpenLibrarySearchDocument[];
};

type OpenLibraryEditionsResponse = {
  entries?: OpenLibraryEdition[];
};

type EditionCandidate = {
  provider: "open-library" | "google-books-gdata";
  key: string;
  url: string;
  title: string;
  subtitle: string | null;
  language: "en" | "vi";
  publishers: string[];
  publishDate: string | null;
  pageCount: number | null;
  physicalFormat: string | null;
  isbn10: string[];
  isbn13: string[];
  byStatement: string | null;
  weight: string | null;
  physicalDimensions: string | null;
  score: number;
};

let previousRequestAt = 0;

const VIETNAMESE_QUERY_TITLES: Record<string, string> = {
  "a-tale-of-two-cities": "Hai kinh thành",
  "around-the-world-in-eighty-days": "Vòng quanh thế giới trong 80 ngày",
  "dracula": "Bá tước Dracula",
  "journey-to-the-center-of-the-earth": "Hành trình vào tâm trái đất",
  "the-brothers-karamazov": "Anh em nhà Karamazov",
  "the-count-of-monte-cristo": "Bá tước Monte Cristo",
  "the-divine-comedy": "Thần khúc",
  "the-metamorphosis": "Hóa thân",
  "the-war-of-the-worlds": "Chiến tranh giữa các thế giới",
};

async function main() {
  const authorNames = new Map(bookAuthors.map((author) => [author.id, author.name]));
  const candidates = [];

  for (const work of bookWorks) {
    const author = work.primaryAuthorIds
      .map((authorId) => authorNames.get(authorId))
      .filter((name): name is string => Boolean(name))
      .join(" ");

    const englishEdition = required(
      bookEditions.find(
        (edition) => edition.workId === work.id && edition.language === "en",
      ),
      `Missing English seed edition for ${work.slug}`,
    );
    const vietnameseEdition = required(
      bookEditions.find(
        (edition) => edition.workId === work.id && edition.language === "vi",
      ),
      `Missing Vietnamese seed edition for ${work.slug}`,
    );

    const en = await findEditionCandidate({
      title: work.localizedTitle.en ?? work.title,
      author,
      language: "en",
    });
    const vi = await findEditionCandidate({
      title:
        VIETNAMESE_QUERY_TITLES[work.slug] ??
        work.localizedTitle.vi ??
        work.title,
      author,
      language: "vi",
    });

    candidates.push({
      workId: work.id,
      workSlug: work.slug,
      authors: work.primaryAuthorIds.map((authorId) =>
        required(authorNames.get(authorId), `Missing author ${authorId}`),
      ),
      editions: {
        en: {
          caseflowEditionId: englishEdition.id,
          caseflowSlug: englishEdition.slug,
          queryTitle: work.localizedTitle.en ?? work.title,
          source: en,
        },
        vi: {
          caseflowEditionId: vietnameseEdition.id,
          caseflowSlug: vietnameseEdition.slug,
          queryTitle:
            VIETNAMESE_QUERY_TITLES[work.slug] ??
            work.localizedTitle.vi ??
            work.title,
          source: vi,
        },
      },
    });

    process.stdout.write(
      `${String(candidates.length).padStart(2, "0")}/50 ${work.slug}: ` +
        `en=${en?.key ?? "MISSING"}, vi=${vi?.key ?? "MISSING"}\n`,
    );
  }

  const sourceCount = candidates.reduce(
    (count, work) =>
      count + Number(Boolean(work.editions.en.source)) + Number(Boolean(work.editions.vi.source)),
    0,
  );
  const missing = candidates.flatMap((work) =>
    (["en", "vi"] as const)
      .filter((language) => work.editions[language].source === null)
      .map((language) => ({ workSlug: work.workSlug, language })),
  );

  const artifact = {
    taskId: "V12-T05",
    providers: [
      {
        label: "Open Library",
        documentationUrl: "https://openlibrary.org/dev/docs/api/search",
      },
      {
        label: "Google Books GData feed",
        documentationUrl: "https://developers.google.com/books/docs/v1/using",
      },
    ],
    checkedAt: CHECKED_AT,
    candidateCount: sourceCount,
    expectedCandidateCount: 100,
    missing,
    works: candidates,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  process.stdout.write(
    `Wrote ${sourceCount}/100 candidates to ${path.relative(process.cwd(), OUTPUT_PATH)}\n`,
  );
}

async function findEditionCandidate(input: {
  title: string;
  author: string;
  language: "en" | "vi";
}): Promise<EditionCandidate | null> {
  const languageCode = input.language === "en" ? "eng" : "vie";
  const search = await searchWorks({
    ...input,
    languageCode,
    includeEditionKeys: input.language === "vi",
  });
  const normalizedAuthor = normalizeText(input.author);
  const matchingWorks = (search.docs ?? []).filter((document) => {
    const names = document.author_name ?? [];
    return names.some((name) => {
      const normalizedName = normalizeText(name);
      return (
        normalizedName.includes(normalizedAuthor) ||
        normalizedAuthor.includes(normalizedName)
      );
    });
  });
  const documents = matchingWorks.length > 0 ? matchingWorks : search.docs ?? [];
  const editionCandidates: OpenLibraryEdition[] = [];

  for (const document of documents.slice(0, 3)) {
    if (document.key?.startsWith("/works/")) {
      const editions = await fetchJson<OpenLibraryEditionsResponse>(
        `${OPEN_LIBRARY_BASE_URL}${document.key}/editions.json?limit=50`,
      );
      editionCandidates.push(...(editions.entries ?? []));
    }

    if (input.language === "vi") {
      for (const editionKey of (document.edition_key ?? []).slice(0, 12)) {
        const fullKey = editionKey.startsWith("/books/")
          ? editionKey
          : `/books/${editionKey}`;
        const edition = await fetchJson<OpenLibraryEdition>(
          `${OPEN_LIBRARY_BASE_URL}${fullKey}.json`,
        );
        editionCandidates.push(edition);
      }
    }
  }

  const uniqueCandidates = new Map<string, OpenLibraryEdition>();
  for (const edition of editionCandidates) {
    if (edition.key) uniqueCandidates.set(edition.key, edition);
  }

  const ranked = [...uniqueCandidates.values()]
    .filter((edition) => editionLanguage(edition) === languageCode)
    .map((edition) => normalizeEdition(edition, input.language, input.title))
    .filter((edition): edition is EditionCandidate => edition !== null)
    .filter((edition) => isAcceptableEdition(edition, input.title))
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key));

  const openLibraryCandidate = ranked[0] ?? null;
  let selectedOpenLibraryCandidate: EditionCandidate | null = null;
  if (input.language === "vi") {
    selectedOpenLibraryCandidate = await findSelectedOpenLibraryEdition({
      title: input.title,
      author: input.author,
    });
  }

  const googleBooksCandidate = await findGoogleBooksCandidate({
    title: input.title,
    author: input.author,
    language: input.language,
  });

  return [
    openLibraryCandidate,
    selectedOpenLibraryCandidate,
    googleBooksCandidate,
  ]
    .filter((candidate): candidate is EditionCandidate => candidate !== null)
    .filter((candidate) => isAcceptableEdition(candidate, input.title))
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key))[0] ?? null;
}

async function findSelectedOpenLibraryEdition(input: {
  title: string;
  author: string;
}): Promise<EditionCandidate | null> {
  const query = new URLSearchParams({
    q: `title:"${input.title}" AND author:"${input.author}" AND language:vie`,
    lang: "vi",
    limit: "1",
    fields: "key,title,author_name,editions",
  });
  const response = await fetchJson<OpenLibrarySearchResponse>(
    `${OPEN_LIBRARY_BASE_URL}/search.json?${query.toString()}`,
  );
  const key = response.docs?.[0]?.editions?.docs?.[0]?.key;
  if (!key?.startsWith("/books/")) return null;

  const edition = await fetchJson<OpenLibraryEdition>(
    `${OPEN_LIBRARY_BASE_URL}${key}.json`,
  );
  if (editionLanguage(edition) !== "vie") return null;

  return normalizeEdition(edition, "vi", input.title);
}

type GoogleBooksText = { $t?: string };

type GoogleBooksEntry = {
  id?: GoogleBooksText;
  title?: GoogleBooksText;
  "dc$creator"?: GoogleBooksText[];
  "dc$language"?: GoogleBooksText[];
  "dc$publisher"?: GoogleBooksText[];
  "dc$date"?: GoogleBooksText[];
  "dc$format"?: GoogleBooksText[];
  "dc$identifier"?: GoogleBooksText[];
};

type GoogleBooksFeed = {
  feed?: {
    entry?: GoogleBooksEntry[];
  };
};

async function findGoogleBooksCandidate(input: {
  title: string;
  author: string;
  language: "en" | "vi";
}): Promise<EditionCandidate | null> {
  const queries = [`${input.title} ${input.author}`, input.title];
  const entries: GoogleBooksEntry[] = [];

  for (const queryText of queries) {
    const query = new URLSearchParams({
      q: queryText,
      "max-results": "40",
      alt: "json",
    });
    const response = await fetchJson<GoogleBooksFeed>(
      `https://books.google.com/books/feeds/volumes?${query.toString()}`,
    );
    entries.push(...(response.feed?.entry ?? []));
  }

  const normalizedAuthor = normalizeText(input.author);
  const ranked = entries
    .map((entry) => normalizeGoogleBooksEdition(entry, input.title))
    .filter((edition): edition is EditionCandidate => edition !== null)
    .filter((edition) => edition.language === input.language)
    .filter((edition) => tokenSimilarity(edition.title, input.title) >= 0.5)
    .filter((edition) => isAcceptableEdition(edition, input.title))
    .filter((edition) => {
      const creatorText = normalizeText(edition.byStatement ?? "");
      return (
        creatorText.includes(normalizedAuthor) ||
        normalizedAuthor.includes(creatorText)
      );
    })
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key));

  return ranked[0] ?? null;
}

function normalizeGoogleBooksEdition(
  entry: GoogleBooksEntry,
  queryTitle: string,
): EditionCandidate | null {
  const feedId = cleanString(entry.id?.$t);
  const title = cleanString(entry.title?.$t);
  const languages = googleTextValues(entry["dc$language"]);
  const language = languages.includes("vi") ? "vi" : languages.includes("en") ? "en" : null;
  if (feedId === null || title === null || language === null) return null;

  const volumeId = feedId.split("/").at(-1);
  if (!volumeId) return null;

  const formats = googleTextValues(entry["dc$format"]);
  const pageCount = formats
    .map((value) => /^(\d+) pages$/i.exec(value)?.[1])
    .find((value): value is string => value !== undefined);
  const identifiers = googleTextValues(entry["dc$identifier"]);
  const isbnValues = identifiers
    .filter((identifier) => identifier.startsWith("ISBN:"))
    .map((identifier) => identifier.slice(5).replace(/[^0-9X]/gi, ""));
  const isbn10 = isbnValues.filter((isbn) => isbn.length === 10);
  const isbn13 = isbnValues.filter((isbn) => isbn.length === 13);
  const authors = googleTextValues(entry["dc$creator"]);
  const publishers = googleTextValues(entry["dc$publisher"]);
  const publishDate = googleTextValues(entry["dc$date"])[0] ?? null;
  const titleSimilarity = tokenSimilarity(title, queryTitle);
  const metadataScore =
    Number(publishers.length > 0) * 2 +
    Number(publishDate !== null) +
    Number(pageCount !== undefined) * 2 +
    Number(isbn13.length > 0) * 3 +
    Number(isbn10.length > 0);
  const normalizedPageCount =
    pageCount === undefined ? null : Number.parseInt(pageCount, 10);
  const qualityScore = editionQualityScore({
    title,
    subtitle: null,
    publishers,
    pageCount: normalizedPageCount,
    byStatement: authors.length > 0 ? authors.join("; ") : null,
  });

  return {
    provider: "google-books-gdata",
    key: volumeId,
    url: `https://books.google.com/books?id=${encodeURIComponent(volumeId)}`,
    title,
    subtitle: null,
    language,
    publishers,
    publishDate,
    pageCount: normalizedPageCount,
    physicalFormat: null,
    isbn10,
    isbn13,
    byStatement: authors.length > 0 ? authors.join("; ") : null,
    weight: null,
    physicalDimensions: null,
    score: Math.round(titleSimilarity * 20) + metadataScore + qualityScore,
  };
}

function googleTextValues(values: GoogleBooksText[] | undefined) {
  return (values ?? [])
    .map((value) => cleanString(value.$t))
    .filter((value): value is string => value !== null);
}

async function searchWorks(input: {
  title: string;
  author: string;
  languageCode: "eng" | "vie";
  includeEditionKeys: boolean;
}): Promise<OpenLibrarySearchResponse> {
  const query = new URLSearchParams({
    title: input.title,
    author: input.author,
    language: input.languageCode,
    limit: "5",
    fields: [
      "key",
      "title",
      "author_name",
      ...(input.includeEditionKeys ? ["edition_key"] : []),
    ].join(","),
  });

  return fetchJson<OpenLibrarySearchResponse>(
    `${OPEN_LIBRARY_BASE_URL}/search.json?${query.toString()}`,
  );
}

function normalizeEdition(
  edition: OpenLibraryEdition,
  language: "en" | "vi",
  queryTitle: string,
): EditionCandidate | null {
  if (!edition.key || !edition.title) return null;

  const titleSimilarity = tokenSimilarity(edition.title, queryTitle);
  const physicalFormat = cleanString(edition.physical_format);
  const formatScore = mapPhysicalFormat(physicalFormat) === null ? 0 : 4;
  const metadataScore =
    Number((edition.publishers?.length ?? 0) > 0) * 2 +
    Number(Boolean(cleanString(edition.publish_date))) +
    Number(typeof edition.number_of_pages === "number") * 2 +
    Number((edition.isbn_13?.length ?? 0) > 0) * 3 +
    Number((edition.isbn_10?.length ?? 0) > 0);
  const pageCount =
    typeof edition.number_of_pages === "number" ? edition.number_of_pages : null;
  const qualityScore = editionQualityScore({
    title: edition.title,
    subtitle: cleanString(edition.subtitle),
    publishers: cleanStrings(edition.publishers),
    pageCount,
    byStatement: cleanString(edition.by_statement),
  });

  return {
    provider: "open-library",
    key: edition.key,
    url: `${OPEN_LIBRARY_BASE_URL}${edition.key}`,
    title: edition.title.trim(),
    subtitle: cleanString(edition.subtitle),
    language,
    publishers: cleanStrings(edition.publishers),
    publishDate: cleanString(edition.publish_date),
    pageCount,
    physicalFormat,
    isbn10: cleanStrings(edition.isbn_10),
    isbn13: cleanStrings(edition.isbn_13),
    byStatement: cleanString(edition.by_statement),
    weight: cleanString(edition.weight),
    physicalDimensions: cleanString(edition.physical_dimensions),
    score:
      Math.round(titleSimilarity * 20) +
      formatScore +
      metadataScore +
      qualityScore,
  };
}

function isAcceptableEdition(candidate: EditionCandidate, queryTitle: string) {
  const searchable = normalizeText(
    [candidate.title, candidate.subtitle, candidate.byStatement]
      .filter(Boolean)
      .join(" "),
  );
  const blockedPhrases = [
    "adapted by",
    "abridged",
    "classics illustrated",
    "graphic novel",
    "mini unit",
    "pop up",
    "retold by",
    "wishbone",
  ];

  return (
    tokenSimilarity(candidate.title, queryTitle) >= 0.5 &&
    blockedPhrases.every((phrase) => !searchable.includes(phrase))
  );
}

function editionQualityScore(input: {
  title: string;
  subtitle: string | null;
  publishers: string[];
  pageCount: number | null;
  byStatement: string | null;
}) {
  const publisherText = normalizeText(input.publishers.join(" "));
  const descriptiveText = normalizeText(
    [input.title, input.subtitle, input.byStatement].filter(Boolean).join(" "),
  );
  const trustedPublisherTokens = [
    "penguin",
    "oxford university press",
    "norton",
    "everyman",
    "simon schuster",
    "scribner",
    "wordsworth",
    "modern library",
    "vintage",
    "barnes noble",
  ];
  const lowConfidencePublisherTokens = [
    "independently published",
    "createspace",
    "amazon",
  ];
  let score = 0;

  if (trustedPublisherTokens.some((token) => publisherText.includes(token))) {
    score += 8;
  }
  if (lowConfidencePublisherTokens.some((token) => publisherText.includes(token))) {
    score -= 5;
  }
  if (input.pageCount !== null) {
    if (input.pageCount >= 120) score += 4;
    if (input.pageCount < 50) score -= 8;
  }
  if (descriptiveText.includes("complete") || descriptiveText.includes("unabridged")) {
    score += 5;
  }

  return score;
}

function editionLanguage(edition: OpenLibraryEdition): string | null {
  const key = edition.languages?.[0]?.key;
  return key?.split("/").at(-1) ?? null;
}

function mapPhysicalFormat(value: string | null) {
  const normalized = normalizeText(value ?? "");
  if (normalized.includes("paperback") || normalized.includes("softcover")) {
    return "paperback" as const;
  }
  if (normalized.includes("hardcover") || normalized.includes("hardback")) {
    return "hardcover" as const;
  }
  return null;
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(normalizeText(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeText(right).split(" ").filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function cleanStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

async function fetchJson<T>(url: string): Promise<T> {
  const elapsed = Date.now() - previousRequestAt;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS - elapsed));
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "CaseFlowBooks/1.2 (portfolio catalog provenance research)",
      Accept: "application/json",
    },
  });
  previousRequestAt = Date.now();

  if (!response.ok) {
    throw new Error(`Catalog source request failed (${response.status}): ${url}`);
  }

  return (await response.json()) as T;
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

void main();
