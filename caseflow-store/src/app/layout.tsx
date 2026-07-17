import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter, SiteHeader } from "@/components/layout";
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
  title: "CaseFlow Books",
  description:
    "Vietnam-first bilingual bookstore with edition-aware catalog discovery.",
  openGraph: {
    description:
      "Vietnam-first bilingual bookstore with edition-aware catalog discovery.",
    siteName: "CaseFlow Books",
    title: "CaseFlow Books",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary",
    description:
      "Vietnam-first bilingual bookstore with edition-aware catalog discovery.",
    title: "CaseFlow Books",
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
