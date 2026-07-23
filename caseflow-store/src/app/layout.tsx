import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter, SiteHeader } from "@/components/layout";
import { storefrontConfig } from "@/config/storefront";
import { getRequestLanguage } from "@/lib/i18n/server";
import { getSiteUrl } from "@/lib/seo/metadata";

import "./globals.css";
import { AppProviders } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: storefrontConfig.name,
  description: `${storefrontConfig.tagline.en} with edition-aware catalog discovery.`,
  openGraph: {
    description: `${storefrontConfig.tagline.en} with edition-aware catalog discovery.`,
    siteName: storefrontConfig.name,
    title: storefrontConfig.name,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    description: `${storefrontConfig.tagline.en} with edition-aware catalog discovery.`,
    title: storefrontConfig.name,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getRequestLanguage();

  return (
    <html lang={language} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders language={language}>
          <SiteHeader language={language} />
          <div className="flex-1">{children}</div>
          <SiteFooter language={language} />
        </AppProviders>
      </body>
    </html>
  );
}
