"use client";

import { BackToTopButton } from "@/components/layout/back-to-top-button";
import { CartDrawer, CartProvider } from "@/features/cart";
import { BookstoreAssistant } from "@/features/assistant";
import { CustomerGuidanceProvider } from "@/features/guidance";
import type { Language } from "@/lib/i18n/language";

export function AppProviders({
  children,
  customerId,
  language,
}: {
  children: React.ReactNode;
  customerId: string | null;
  language: Language;
}) {
  return (
    <CustomerGuidanceProvider customerId={customerId} language={language}>
      <CartProvider>
        {children}
        <CartDrawer language={language} />
        <BackToTopButton language={language} />
        <BookstoreAssistant key={language} language={language} />
      </CartProvider>
    </CustomerGuidanceProvider>
  );
}
