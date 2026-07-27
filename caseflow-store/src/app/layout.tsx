import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter, SiteHeader } from "@/components/layout";
import { storefrontConfig } from "@/config/storefront";
import { getCustomerAuthState } from "@/lib/auth/customer";
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
  const [authState, language] = await Promise.all([
    getCustomerAuthState(),
    getRequestLanguage(),
  ]);
  const customerId =
    authState.status === "authenticated" && authState.user.role === "customer"
      ? authState.user.id
      : null;

  return (
    <html lang={language} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders customerId={customerId} language={language}>
          <SiteHeader authState={authState} language={language} />
          <div className="flex-1">{children}</div>
          <SiteFooter language={language} />
        </AppProviders>
      </body>
    </html>
  );
}
