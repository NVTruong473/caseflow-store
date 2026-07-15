"use client";

import { CartDrawer, CartProvider } from "@/features/cart";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
