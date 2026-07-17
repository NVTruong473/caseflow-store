"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

import { useCart } from "./cart-context";

type CartSummaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export function CartSummaryButton({
  children,
  className,
  label = "Cart",
  onClick,
  ...props
}: CartSummaryButtonProps) {
  const { openCart, totalQuantity } = useCart();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-small font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      onClick={(event) => {
        openCart();
        onClick?.(event);
      }}
      data-cart-count={totalQuantity}
      data-cart-drawer-open
      suppressHydrationWarning
      {...props}
    >
      {children ?? `${label} (${totalQuantity})`}
    </button>
  );
}
