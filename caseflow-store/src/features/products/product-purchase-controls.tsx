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

type ProductPurchaseControlsProps = {
  productId: string;
  productName: string;
  stock: number;
};

type FeedbackState = {
  tone: "success" | "error";
  message: string;
};

function clampQuantity(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ProductPurchaseControls({
  productId,
  productName,
  stock,
}: ProductPurchaseControlsProps) {
  const availableStock = Math.max(0, Math.floor(stock));
  const isInStock = availableStock > 0;
  const [quantity, setQuantity] = React.useState(isInStock ? 1 : 0);
  const [feedback, setFeedback] = React.useState<FeedbackState | null>(null);
  const { addItem, items } = useCart();
  const cartQuantity =
    items.find((item) => item.productId === productId)?.quantity ?? 0;
  const remainingQuantity = Math.max(0, availableStock - cartQuantity);
  const canAddToCart = isInStock && remainingQuantity > 0;
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
    if (!isInStock) {
      setFeedback({
        tone: "error",
        message: "This product is currently out of stock.",
      });
      return;
    }

    if (!canAddToCart) {
      setFeedback({
        tone: "error",
        message: "Your cart already contains all available stock.",
      });
      return;
    }

    addItem(productId, selectedQuantity, { maxQuantity: availableStock });
    setFeedback({
      tone: "success",
      message: `Added ${selectedQuantity} x ${productName} to cart.`,
    });
  }

  const stockMessage = isInStock
    ? `Available stock: ${availableStock}`
    : "Currently unavailable";

  return (
    <Card
      padding="lg"
      data-product-purchase-controls={productId}
      className="flex flex-col gap-case-md"
    >
      <CardHeader>
        <CardTitle>Add to cart</CardTitle>
        <CardDescription>{stockMessage}</CardDescription>
      </CardHeader>

      <CardContent className="mt-0 flex flex-col gap-case-md">
        {isInStock ? (
          <p
            className="text-small text-text-muted"
            data-purchase-quantity-boundary
          >
            In cart: {cartQuantity}. Remaining to add: {remainingQuantity}.
          </p>
        ) : null}

        <div className="flex items-end gap-case-sm">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={`Decrease ${productName} quantity`}
            disabled={!canAddToCart || selectedQuantity <= 1}
            onClick={() => updateQuantity(selectedQuantity - 1)}
            data-quantity-decrement
          >
            -
          </Button>

          <Input
            id={`quantity-${productId}`}
            label="Quantity"
            type="number"
            inputMode="numeric"
            min={canAddToCart ? 1 : 0}
            max={selectableMax}
            step={1}
            value={selectedQuantity}
            disabled={!canAddToCart}
            onChange={handleQuantityInputChange}
            wrapperClassName="min-w-0 flex-1"
            data-quantity-input
          />

          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={`Increase ${productName} quantity`}
            disabled={!canAddToCart || selectedQuantity >= selectableMax}
            onClick={() => updateQuantity(selectedQuantity + 1)}
            data-quantity-increment
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
          data-add-to-cart-button
        >
          Add to cart
        </Button>

        {!isInStock ? (
          <ErrorMessage>This product is currently out of stock.</ErrorMessage>
        ) : null}

        {isInStock && !canAddToCart ? (
          <ErrorMessage>Your cart already contains all available stock.</ErrorMessage>
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
            data-add-to-cart-feedback={feedback.tone}
          >
            {feedback.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
