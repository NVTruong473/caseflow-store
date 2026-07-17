import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: ["/", "/catalog", "/orders/track", "/products/"],
      disallow: [
        "/account",
        "/admin",
        "/api",
        "/catalog-state-preview",
        "/checkout",
        "/ui-preview",
      ],
      userAgent: "*",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
