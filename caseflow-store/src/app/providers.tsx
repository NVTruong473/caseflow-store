"use client";

import { BackToTopButton } from "@/components/layout/back-to-top-button";
import { CartDrawer, CartProvider } from "@/features/cart";
import { BookstoreAssistant } from "@/features/assistant";
import type { Language } from "@/lib/i18n/language";

export function AppProviders({
  children,
  language,
}: {
  children: React.ReactNode;
  language: Language;
}) {
  return (
    <CartProvider>
      {children}
      <CartDrawer language={language} />
      <BackToTopButton language={language} />
      <BookstoreAssistant key={language} language={language} />
    </CartProvider>
  );
}
