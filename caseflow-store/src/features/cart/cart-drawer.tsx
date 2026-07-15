"use client";

import Link from "next/link";
import * as React from "react";

import { Badge, Button, ErrorMessage, Skeleton } from "@/components/ui";
import { ProductVisual } from "@/features/products";
import { formatVnd } from "@/lib/format/currency";
import { cn } from "@/lib/utils/cn";
import type { ValidatedCartData } from "@/types/catalog";

import { useCart } from "./cart-context";

type CartDrawerReviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: ValidatedCartData }
  | { status: "error"; message: string };

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const focusReturnFallbackSelectors = [
  "[data-cart-drawer-open]",
  "[data-mobile-navigation-toggle]",
  "a[href='/']",
];

function isVisibleFocusTarget(element: HTMLElement) {
  if (element === document.body) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    styles.display !== "none" &&
    styles.visibility !== "hidden"
  );
}

function focusAfterCartDrawerClose(previousElement: Element | null) {
  if (
    previousElement instanceof HTMLElement &&
    document.contains(previousElement) &&
    isVisibleFocusTarget(previousElement)
  ) {
    previousElement.focus();
    return;
  }

  for (const selector of focusReturnFallbackSelectors) {
    const fallbackElement = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    ).find(isVisibleFocusTarget);

    if (fallbackElement) {
      fallbackElement.focus();
      return;
    }
  }
}

export function CartDrawer() {
  const {
    clearCart,
    closeCart,
    isCartOpen,
    items,
    removeItem,
    totalQuantity,
    updateItemQuantity,
  } = useCart();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);
  const previousActiveElementRef = React.useRef<Element | null>(null);
  const [reviewState, setReviewState] = React.useState<CartDrawerReviewState>({
    status: "idle",
  });

  const cartLines =
    reviewState.status === "success"
      ? reviewState.data.items.map((line) => ({
          category: line.category,
          item: { productId: line.productId, quantity: line.quantity },
          lineTotal: line.lineTotal,
          product: line.product,
        }))
      : [];
  const estimatedSubtotal =
    reviewState.status === "success" ? reviewState.data.subtotal : 0;

  function updateBoundedQuantity(
    productId: string,
    nextQuantity: number,
    stock?: number,
  ) {
    updateItemQuantity(
      productId,
      nextQuantity,
      stock && stock > 0 ? { maxQuantity: stock } : undefined,
    );
  }

  React.useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    previousActiveElementRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;

      focusAfterCartDrawerClose(previousActiveElementRef.current);
    };
  }, [isCartOpen]);

  React.useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    const abortController = new AbortController();

    async function validateCart() {
      setReviewState({ status: "loading" });

      try {
        const response = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          signal: abortController.signal,
        });
        const payload =
          (await response.json()) as ApiResponse<ValidatedCartData>;

        if (!response.ok || payload.error || !payload.data) {
          setReviewState({
            status: "error",
            message:
              payload.error?.message ??
              "Cart could not be checked against current catalog data.",
          });
          return;
        }

        setReviewState({ status: "success", data: payload.data });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setReviewState({
          status: "error",
          message: "Cart validation is unavailable. Try again shortly.",
        });
      }
    }

    void validateCart();

    return () => abortController.abort();
  }, [isCartOpen, items]);

  if (!isCartOpen) {
    return null;
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      closeCart();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    ).filter((element) => element.offsetParent !== null);

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50" data-cart-drawer>
      <div
        className="absolute inset-0 bg-foreground/30"
        aria-hidden="true"
        onClick={closeCart}
        data-cart-drawer-backdrop
      />

      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-border bg-surface shadow-xl",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        )}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="flex items-start justify-between gap-case-md border-b border-border p-case-lg">
          <div className="min-w-0">
            <p className="text-small font-medium uppercase text-text-muted">
              Cart
            </p>
            <h2
              id="cart-drawer-title"
              className="text-heading-3 font-semibold text-foreground"
              suppressHydrationWarning
            >
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
            </h2>
          </div>

          <Button
            ref={closeButtonRef}
            type="button"
            variant="secondary"
            size="sm"
            onClick={closeCart}
            data-cart-drawer-close
          >
            Close
          </Button>
        </div>

        {items.length === 0 ? (
          <div
            className="flex flex-1 flex-col justify-center gap-case-md p-case-lg"
            data-cart-drawer-empty
          >
            <h3 className="text-heading-3 font-semibold text-foreground">
              Your cart is empty.
            </h3>
            <p className="text-body leading-7 text-text-muted">
              Add a product from the catalog to review it here.
            </p>
            <Button type="button" variant="primary" onClick={closeCart}>
              Continue shopping
            </Button>
          </div>
        ) : reviewState.status === "loading" ||
          reviewState.status === "idle" ? (
          <div
            className="flex flex-1 flex-col gap-case-md p-case-lg"
            data-cart-drawer-loading
          >
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-14" />
          </div>
        ) : reviewState.status === "error" ? (
          <div
            className="flex flex-1 flex-col justify-center gap-case-md p-case-lg"
            data-cart-drawer-error
          >
            <ErrorMessage>{reviewState.message}</ErrorMessage>
            <div className="grid gap-case-sm sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={closeCart}>
                Continue shopping
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={clearCart}
              >
                Clear cart
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-case-lg">
              <ul className="flex flex-col gap-case-md">
                {cartLines.map(({ category, item, lineTotal, product }) => (
                  <li
                    key={item.productId}
                    className="rounded-lg border border-border bg-surface p-case-md"
                    data-cart-drawer-item={item.productId}
                  >
                    {product ? (
                      <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-case-md">
                        <div className="aspect-square overflow-hidden rounded-md border border-border bg-surface-muted p-1">
                          <ProductVisual
                            categorySlug={category?.slug ?? "phone-cases"}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-case-xs">
                            {category ? (
                              <Badge variant="neutral" size="sm">
                                {category.name}
                              </Badge>
                            ) : null}
                            <Badge
                              variant={product.stock > 0 ? "success" : "error"}
                              size="sm"
                            >
                              {product.stock > 0 ? "In stock" : "Out of stock"}
                            </Badge>
                          </div>

                          <Link
                            href={`/products/${product.slug}`}
                            className="mt-case-sm block truncate font-semibold text-foreground hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            onClick={closeCart}
                          >
                            {product.name}
                          </Link>

                          <div className="mt-case-sm flex flex-col gap-case-sm">
                            <div className="flex flex-wrap items-center justify-between gap-case-sm">
                              <p className="text-small text-text-muted">
                                {formatVnd(product.price)} each
                              </p>
                              <p className="font-semibold text-foreground">
                                {formatVnd(lineTotal)}
                              </p>
                            </div>

                            <div
                              className="flex flex-wrap items-center justify-between gap-case-sm"
                              data-cart-drawer-quantity-controls={
                                item.productId
                              }
                            >
                              <p className="text-small font-medium text-foreground">
                                Quantity
                              </p>
                              <div className="inline-flex items-center gap-case-xs">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  aria-label={`Decrease ${product.name} quantity`}
                                  disabled={item.quantity <= 1}
                                  onClick={() =>
                                    updateBoundedQuantity(
                                      item.productId,
                                      item.quantity - 1,
                                      product.stock,
                                    )
                                  }
                                  data-cart-drawer-quantity-decrement={
                                    item.productId
                                  }
                                >
                                  -
                                </Button>
                                <span
                                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-border px-3 text-small font-medium text-foreground"
                                  data-cart-drawer-quantity={item.productId}
                                >
                                  {item.quantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  aria-label={`Increase ${product.name} quantity`}
                                  disabled={
                                    product.stock <= 0 ||
                                    item.quantity >= product.stock
                                  }
                                  onClick={() =>
                                    updateBoundedQuantity(
                                      item.productId,
                                      item.quantity + 1,
                                      product.stock,
                                    )
                                  }
                                  data-cart-drawer-quantity-increment={
                                    item.productId
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-w-0 flex-col gap-case-sm">
                        <h3 className="font-semibold text-foreground">
                          Unavailable product
                        </h3>
                        <p className="text-small text-text-muted">
                          Qty {item.quantity}
                        </p>
                      </div>
                    )}

                    {product && item.quantity > product.stock ? (
                      <div
                        className="mt-case-md flex flex-col gap-case-sm"
                        data-cart-drawer-boundary-error={item.productId}
                      >
                        <ErrorMessage>
                          Only {product.stock} left. Reduce this quantity before
                          checkout.
                        </ErrorMessage>
                        {product.stock > 0 ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              updateBoundedQuantity(
                                item.productId,
                                product.stock,
                                product.stock,
                              )
                            }
                            data-cart-drawer-set-max={item.productId}
                          >
                            Set to max
                          </Button>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-case-md flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.productId)}
                        data-cart-drawer-remove={item.productId}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border p-case-lg">
              <div className="flex items-center justify-between gap-case-md">
                <p className="font-medium text-foreground">
                  Estimated subtotal
                </p>
                <p
                  className="text-heading-3 font-semibold text-foreground"
                  data-cart-drawer-subtotal
                >
                  {formatVnd(estimatedSubtotal)}
                </p>
              </div>

              <div className="mt-case-md grid gap-case-sm">
                <Link
                  href="/checkout"
                  className="inline-flex min-h-12 min-w-0 items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={closeCart}
                  data-cart-drawer-checkout
                >
                  Checkout
                </Link>
                <div className="grid gap-case-sm sm:grid-cols-2">
                  <Button type="button" variant="secondary" onClick={closeCart}>
                    Continue shopping
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={clearCart}
                    data-cart-drawer-clear
                  >
                    Clear cart
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
