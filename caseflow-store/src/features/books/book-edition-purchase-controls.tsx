"use client";

import * as React from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorMessage,
  Input,
} from "@/components/ui";
import { useCart } from "@/features/cart";
import type { Language } from "@/lib/i18n/language";
import type { InventoryStatus } from "@/types/domain";

type BookEditionPurchaseControlsProps = {
  editionId: string;
  editionTitle: string;
  inventoryStatus: InventoryStatus;
  language: Language;
  stockQuantity: number;
};

type FeedbackState = {
  tone: "success" | "error";
  message: string;
};

const purchaseCopy = {
  en: {
    addToCart: "Add to cart",
    allStockInCart: "Your cart already contains all available stock.",
    availableStock: (count: number) => `${count} available`,
    cardDescription: "Choose a quantity for this specific edition.",
    cardTitle: "Buy this edition",
    decrease: (title: string) => `Decrease ${title} quantity`,
    feedback: (quantity: number, title: string) =>
      `Added ${quantity} x ${title} to cart.`,
    increase: (title: string) => `Increase ${title} quantity`,
    inCart: (cartQuantity: number, remainingQuantity: number) =>
      `In cart: ${cartQuantity}. Remaining to add: ${remainingQuantity}.`,
    quantity: "Quantity",
    unavailable: "This edition is currently unavailable.",
  },
  vi: {
    addToCart: "Thêm vào giỏ",
    allStockInCart: "Giỏ hàng đã có toàn bộ số lượng còn lại.",
    availableStock: (count: number) => `Còn ${count} cuốn`,
    cardDescription: "Chọn số lượng cho đúng ấn bản này.",
    cardTitle: "Mua ấn bản này",
    decrease: (title: string) => `Giảm số lượng ${title}`,
    feedback: (quantity: number, title: string) =>
      `Đã thêm ${quantity} x ${title} vào giỏ hàng.`,
    increase: (title: string) => `Tăng số lượng ${title}`,
    inCart: (cartQuantity: number, remainingQuantity: number) =>
      `Trong giỏ: ${cartQuantity}. Có thể thêm: ${remainingQuantity}.`,
    quantity: "Số lượng",
    unavailable: "Ấn bản này hiện chưa thể mua.",
  },
} as const;

function clampQuantity(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isSellable(status: InventoryStatus, stockQuantity: number) {
  return (
    stockQuantity > 0 &&
    status !== "out-of-stock" &&
    status !== "discontinued"
  );
}

export function BookEditionPurchaseControls({
  editionId,
  editionTitle,
  inventoryStatus,
  language,
  stockQuantity,
}: BookEditionPurchaseControlsProps) {
  const copy = purchaseCopy[language];
  const availableStock = Math.max(0, Math.floor(stockQuantity));
  const canSellEdition = isSellable(inventoryStatus, availableStock);
  const [quantity, setQuantity] = React.useState(canSellEdition ? 1 : 0);
  const [feedback, setFeedback] = React.useState<FeedbackState | null>(null);
  const { addItem, items } = useCart();
  const cartQuantity =
    items.find((item) => item.productId === editionId)?.quantity ?? 0;
  const remainingQuantity = Math.max(0, availableStock - cartQuantity);
  const canAddToCart = canSellEdition && remainingQuantity > 0;
  const selectableMax = canAddToCart ? remainingQuantity : 0;
  const selectedQuantity = canAddToCart
    ? clampQuantity(quantity || 1, 1, selectableMax)
    : 0;

  function updateQuantity(nextQuantity: number) {
    if (!canAddToCart) {
      return;
    }

    setQuantity(clampQuantity(Math.trunc(nextQuantity), 1, selectableMax));
    setFeedback(null);
  }

  function handleQuantityInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const nextQuantity = event.currentTarget.valueAsNumber;

    updateQuantity(Number.isNaN(nextQuantity) ? 1 : nextQuantity);
  }

  function handleAddToCart() {
    if (!canSellEdition) {
      setFeedback({ tone: "error", message: copy.unavailable });
      return;
    }

    if (!canAddToCart) {
      setFeedback({ tone: "error", message: copy.allStockInCart });
      return;
    }

    addItem(editionId, selectedQuantity, { maxQuantity: availableStock });
    setFeedback({
      tone: "success",
      message: copy.feedback(selectedQuantity, editionTitle),
    });
  }

  return (
    <Card
      padding="md"
      className="flex flex-col gap-case-sm"
      data-book-purchase-controls={editionId}
    >
      <CardHeader>
        <CardTitle>{copy.cardTitle}</CardTitle>
        <CardDescription>
          {canSellEdition ? copy.cardDescription : copy.unavailable}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-0 flex flex-col gap-case-sm">
        <div className="rounded-md border border-border bg-background px-3 py-2">
          <p className="text-small font-medium text-foreground">
            {copy.availableStock(availableStock)}
          </p>
          {canSellEdition ? (
            <p
              className="mt-1 text-small text-text-muted"
              data-book-purchase-boundary
            >
              {copy.inCart(cartQuantity, remainingQuantity)}
            </p>
          ) : null}
        </div>

        <div className="flex items-end gap-case-xs sm:gap-case-sm">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={copy.decrease(editionTitle)}
            disabled={!canAddToCart || selectedQuantity <= 1}
            onClick={() => updateQuantity(selectedQuantity - 1)}
            data-book-quantity-decrement
          >
            -
          </Button>

          <Input
            id={`book-quantity-${editionId}`}
            label={copy.quantity}
            type="number"
            inputMode="numeric"
            min={canAddToCart ? 1 : 0}
            max={selectableMax}
            step={1}
            value={selectedQuantity}
            disabled={!canAddToCart}
            onChange={handleQuantityInputChange}
            wrapperClassName="min-w-0 flex-1"
            data-book-quantity-input
          />

          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={copy.increase(editionTitle)}
            disabled={!canAddToCart || selectedQuantity >= selectableMax}
            onClick={() => updateQuantity(selectedQuantity + 1)}
            data-book-quantity-increment
          >
            +
          </Button>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!canAddToCart}
          onClick={handleAddToCart}
          data-book-add-to-cart-button
        >
          {copy.addToCart}
        </Button>

        {!canSellEdition ? <ErrorMessage>{copy.unavailable}</ErrorMessage> : null}
        {canSellEdition && !canAddToCart ? (
          <ErrorMessage>{copy.allStockInCart}</ErrorMessage>
        ) : null}

        {feedback ? (
          <p
            role={feedback.tone === "error" ? "alert" : "status"}
            aria-live="polite"
            className={
              feedback.tone === "success"
                ? "text-small font-medium text-success"
                : "text-small font-medium text-error"
            }
            data-book-add-to-cart-feedback={feedback.tone}
          >
            {feedback.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
