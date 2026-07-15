import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteFooter, SiteHeader } from "@/components/layout";

import "./globals.css";
import { AppProviders } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CaseFlow Store",
  description:
    "Phone accessories storefront with model-aware product discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
