import type { MetadataRoute } from "next";

import { bookstorePolicies } from "@/lib/policies/bookstore-policies";
import { listSupabaseBookCatalog } from "@/lib/repositories/supabase-books";
import { absoluteUrl } from "@/lib/seo/metadata";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const records = await listSupabaseBookCatalog({ sort: "title-asc" });
  const now = new Date();
  const publicPages: MetadataRoute.Sitemap = [
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 1,
      url: absoluteUrl("/"),
    },
    {
      changeFrequency: "daily",
      lastModified: now,
      priority: 0.9,
      url: absoluteUrl("/catalog"),
    },
    {
      changeFrequency: "monthly",
      lastModified: now,
      priority: 0.5,
      url: absoluteUrl("/orders/track"),
    },
    ...bookstorePolicies.map((policy) => ({
      changeFrequency: "monthly" as const,
      lastModified: now,
      priority: 0.45,
      url: absoluteUrl(policy.path),
    })),
  ];
  const bookPages = records.map((record) => ({
    changeFrequency: "weekly" as const,
    lastModified: new Date(record.edition.updatedAt),
    priority: 0.8,
    url: absoluteUrl(`/products/${record.edition.slug}`),
  }));

  return [...publicPages, ...bookPages];
}
