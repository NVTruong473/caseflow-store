"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  Badge,
  Button,
  Container,
  ErrorMessage,
  Input,
  Skeleton,
} from "@/components/ui";
import { useCart } from "@/features/cart";
import {
  createCheckoutSuccessSnapshot,
  writeCheckoutSuccessSnapshot,
} from "@/features/checkout/checkout-success-storage";
import { ProductVisual } from "@/features/products";
import { formatVnd } from "@/lib/format/currency";
import {
  customerEmailSchema,
  customerNameSchema,
  customerPhoneSchema,
  shippingAddressSchema,
} from "@/lib/validation/domain";
import type { ValidatedCartData } from "@/types/catalog";
import type { CartItem, Order, OrderItem } from "@/types/domain";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
};

type CartValidationData = ValidatedCartData;

type CreatedOrderData = {
  order: Order;
  items: OrderItem[];
};

type CartReviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: CartValidationData }
  | { status: "error"; code: string; message: string };

type CheckoutFieldName =
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "shippingAddress";

type CheckoutFormValues = Record<CheckoutFieldName, string>;
type CheckoutFormErrors = Partial<Record<CheckoutFieldName, string>>;
type CheckoutTouchedFields = Record<CheckoutFieldName, boolean>;
type CheckoutFormStatus = "idle" | "valid";
type CheckoutSubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

const checkoutFieldNames: CheckoutFieldName[] = [
  "customerName",
  "customerEmail",
  "customerPhone",
  "shippingAddress",
];

const initialCheckoutFormValues: CheckoutFormValues = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingAddress: "",
};

const initialTouchedFields: CheckoutTouchedFields = {
  customerName: false,
  customerEmail: false,
  customerPhone: false,
  shippingAddress: false,
};

const demoShippingLabel = "Not charged in demo";
const demoPaymentLabel = "No payment collected";

export function CheckoutPage() {
  const { clearCart, hasLoadedStorage, items, openCart, totalQuantity } =
    useCart();
  const [reviewState, setReviewState] = React.useState<CartReviewState>({
    status: "idle",
  });

  React.useEffect(() => {
    if (!hasLoadedStorage) {
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items }),
          signal: abortController.signal,
        });
        const payload =
          (await response.json()) as ApiResponse<CartValidationData>;

        if (!response.ok || payload.error || !payload.data) {
          setReviewState({
            status: "error",
            code: payload.error?.code ?? "VALIDATION_ERROR",
            message:
              payload.error?.message ??
              "Cart could not be validated for checkout.",
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
          code: "NETWORK_ERROR",
          message: "Cart validation is unavailable. Try again before ordering.",
        });
      }
    }

    void validateCart();

    return () => abortController.abort();
  }, [hasLoadedStorage, items]);

  const isCartEmpty = hasLoadedStorage && items.length === 0;

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-checkout-page
    >
      <Container className="flex flex-col gap-case-xl">
        <div className="flex flex-col gap-case-md">
          <Link
            href="/#products"
            className="text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to products
          </Link>
          <div className="flex max-w-3xl flex-col gap-case-sm">
            <Badge variant="primary">Guest checkout</Badge>
            <h1 className="text-heading-1 font-semibold text-foreground">
              Checkout
            </h1>
            <p className="text-body leading-7 text-text-muted">
              Review the cart against current stock, enter shipping details, and
              place a simulated order without payment card fields.
            </p>
          </div>
        </div>

        {!hasLoadedStorage ? (
          <CheckoutLoadingState />
        ) : isCartEmpty ? (
          <CheckoutEmptyState />
        ) : (
          <div className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <CheckoutDetailsForm
              clearCart={clearCart}
              items={items}
              reviewState={reviewState}
            />
            <CheckoutCartReview
              clearCart={clearCart}
              openCart={openCart}
              reviewState={reviewState}
              totalQuantity={totalQuantity}
            />
          </div>
        )}
      </Container>
    </main>
  );
}

function getCheckoutFieldError(
  fieldName: CheckoutFieldName,
  value: string,
): string | null {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    switch (fieldName) {
      case "customerName":
        return "Enter your full name.";
      case "customerEmail":
        return "Enter your email address.";
      case "customerPhone":
        return "Enter your phone number.";
      case "shippingAddress":
        return "Enter your shipping address.";
    }
  }

  switch (fieldName) {
    case "customerName":
      return customerNameSchema.safeParse(value).success
        ? null
        : "Name must be 120 characters or fewer.";
    case "customerEmail":
      return customerEmailSchema.safeParse(value).success
        ? null
        : "Enter a valid email address.";
    case "customerPhone":
      return customerPhoneSchema.safeParse(value).success
        ? null
        : "Enter a phone number using 7-24 digits and phone symbols.";
    case "shippingAddress":
      return shippingAddressSchema.safeParse(value).success
        ? null
        : "Shipping address must be 500 characters or fewer.";
  }
}

function validateCheckoutForm(values: CheckoutFormValues) {
  const errors: CheckoutFormErrors = {};

  for (const fieldName of checkoutFieldNames) {
    const error = getCheckoutFieldError(fieldName, values[fieldName]);

    if (error) {
      errors[fieldName] = error;
    }
  }

  return errors;
}

function hasCheckoutFormErrors(errors: CheckoutFormErrors) {
  return Object.keys(errors).length > 0;
}

function markAllFieldsTouched(): CheckoutTouchedFields {
  return {
    customerName: true,
    customerEmail: true,
    customerPhone: true,
    shippingAddress: true,
  };
}

function normalizeCheckoutFormValues(
  values: CheckoutFormValues,
): CheckoutFormValues {
  return {
    customerName: values.customerName.trim(),
    customerEmail: values.customerEmail.trim(),
    customerPhone: values.customerPhone.trim(),
    shippingAddress: values.shippingAddress.trim(),
  };
}

function getValidatedItemCount(data: CartValidationData) {
  return data.items.reduce((total, line) => total + line.quantity, 0);
}

function CheckoutLoadingState() {
  return (
    <div
      className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_420px]"
      data-checkout-loading
    >
      <section className="rounded-lg border border-border bg-surface p-case-lg">
        <Skeleton className="h-7 w-48" />
        <div className="mt-case-lg grid gap-case-md sm:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface p-case-lg">
        <Skeleton className="h-7 w-40" />
        <div className="mt-case-lg flex flex-col gap-case-sm">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-12" />
        </div>
      </section>
    </div>
  );
}

function CheckoutEmptyState() {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-xl"
      data-checkout-empty
    >
      <div className="flex max-w-xl flex-col gap-case-md">
        <h2 className="text-heading-2 font-semibold text-foreground">
          Your cart is empty.
        </h2>
        <p className="text-body leading-7 text-text-muted">
          Add at least one accessory before starting checkout.
        </p>
        <Link
          href="/#products"
          className="inline-flex min-h-11 w-fit min-w-0 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Shop products
        </Link>
      </div>
    </section>
  );
}

function CheckoutDetailsForm({
  clearCart,
  items,
  reviewState,
}: {
  clearCart: () => void;
  items: CartItem[];
  reviewState: CartReviewState;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<CheckoutFormValues>(
    initialCheckoutFormValues,
  );
  const [errors, setErrors] = React.useState<CheckoutFormErrors>({});
  const [touchedFields, setTouchedFields] =
    React.useState<CheckoutTouchedFields>(initialTouchedFields);
  const [formStatus, setFormStatus] =
    React.useState<CheckoutFormStatus>("idle");
  const [submitState, setSubmitState] = React.useState<CheckoutSubmitState>({
    status: "idle",
  });
  const isSubmitting = submitState.status === "submitting";
  const isCartReadyForOrder = reviewState.status === "success";

  function updateField(fieldName: CheckoutFieldName, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setFormStatus("idle");
    setSubmitState({ status: "idle" });

    if (!touchedFields[fieldName]) {
      return;
    }

    setErrors((currentErrors) => {
      const fieldError = getCheckoutFieldError(fieldName, value);
      const nextErrors = { ...currentErrors };

      if (fieldError) {
        nextErrors[fieldName] = fieldError;
      } else {
        delete nextErrors[fieldName];
      }

      return nextErrors;
    });
  }

  function validateField(fieldName: CheckoutFieldName) {
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      [fieldName]: true,
    }));
    setErrors((currentErrors) => {
      const fieldError = getCheckoutFieldError(fieldName, values[fieldName]);
      const nextErrors = { ...currentErrors };

      if (fieldError) {
        nextErrors[fieldName] = fieldError;
      } else {
        delete nextErrors[fieldName];
      }

      return nextErrors;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedValues = normalizeCheckoutFormValues(values);
    const nextErrors = validateCheckoutForm(normalizedValues);

    setValues(normalizedValues);
    setTouchedFields(markAllFieldsTouched());
    setErrors(nextErrors);

    if (hasCheckoutFormErrors(nextErrors)) {
      setFormStatus("idle");
      setSubmitState({ status: "idle" });
      return;
    }

    setFormStatus("valid");

    if (reviewState.status !== "success") {
      setSubmitState({
        status: "error",
        message: "Resolve cart review before placing the simulated order.",
      });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...normalizedValues,
          items,
        }),
      });
      const payload = (await response.json()) as ApiResponse<CreatedOrderData>;

      if (!response.ok || payload.error || !payload.data) {
        setSubmitState({
          status: "error",
          message:
            payload.error?.message ??
            "Order could not be created. Review the cart and try again.",
        });
        return;
      }

      writeCheckoutSuccessSnapshot(
        window.sessionStorage,
        createCheckoutSuccessSnapshot(payload.data),
      );
      clearCart();
      router.push(
        `/checkout/success?orderCode=${encodeURIComponent(
          payload.data.order.orderCode,
        )}`,
      );
    } catch {
      setSubmitState({
        status: "error",
        message: "Order service is unavailable. Try again before ordering.",
      });
    }
  }

  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-checkout-form-shell
      data-checkout-form-status={formStatus}
    >
      <div className="flex flex-col gap-case-sm">
        <h2 className="text-heading-2 font-semibold text-foreground">
          Contact and shipping
        </h2>
        <p className="text-body leading-7 text-text-muted">
          Guest details are used for the simulated order record only.
        </p>
      </div>

      <form
        className="mt-case-lg grid gap-case-md"
        onSubmit={handleSubmit}
        noValidate
        data-checkout-form
      >
        <div className="grid gap-case-md sm:grid-cols-2">
          <Input
            id="checkout-customer-name"
            label="Full name"
            name="customerName"
            autoComplete="name"
            value={values.customerName}
            onBlur={() => validateField("customerName")}
            onChange={(event) =>
              updateField("customerName", event.currentTarget.value)
            }
            error={
              touchedFields.customerName ? errors.customerName : undefined
            }
            hint="Use the name for order support."
            data-checkout-customer-name
          />
          <Input
            id="checkout-customer-email"
            label="Email"
            name="customerEmail"
            type="email"
            autoComplete="email"
            value={values.customerEmail}
            onBlur={() => validateField("customerEmail")}
            onChange={(event) =>
              updateField("customerEmail", event.currentTarget.value)
            }
            error={
              touchedFields.customerEmail ? errors.customerEmail : undefined
            }
            hint="A confirmation can be sent here later."
            data-checkout-customer-email
          />
          <Input
            id="checkout-customer-phone"
            label="Phone"
            name="customerPhone"
            type="tel"
            autoComplete="tel"
            value={values.customerPhone}
            onBlur={() => validateField("customerPhone")}
            onChange={(event) =>
              updateField("customerPhone", event.currentTarget.value)
            }
            error={
              touchedFields.customerPhone ? errors.customerPhone : undefined
            }
            hint="Digits, spaces, +, -, parentheses, and dots are accepted."
            data-checkout-customer-phone
          />
          <Input
            id="checkout-shipping-address"
            label="Shipping address"
            name="shippingAddress"
            autoComplete="street-address"
            value={values.shippingAddress}
            onBlur={() => validateField("shippingAddress")}
            onChange={(event) =>
              updateField("shippingAddress", event.currentTarget.value)
            }
            error={
              touchedFields.shippingAddress
                ? errors.shippingAddress
                : undefined
            }
            hint="Street, ward or district, city, and delivery note if needed."
            data-checkout-shipping-address
          />
        </div>

        <div className="flex flex-col gap-case-sm border-t border-border pt-case-md sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-small text-text-muted">
              No card number, expiry date, or CVV is collected.
            </p>
            {formStatus === "valid" ? (
              <p
                role="status"
                className="mt-case-xs text-small font-medium text-success"
                data-checkout-customer-validation-success
              >
                Customer details are valid for the next checkout step.
              </p>
            ) : null}
            {submitState.status === "error" ? (
              <div className="mt-case-sm" data-checkout-submit-error>
                <ErrorMessage>{submitState.message}</ErrorMessage>
              </div>
            ) : null}
            {!isCartReadyForOrder ? (
              <p
                className="mt-case-xs text-small text-text-muted"
                data-checkout-submit-readiness
              >
                Cart review must be checked before placing the simulated order.
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!isCartReadyForOrder}
            isLoading={isSubmitting}
            data-checkout-submit
          >
            {isSubmitting ? "Creating order" : "Place simulated order"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function CheckoutCartReview({
  clearCart,
  openCart,
  reviewState,
  totalQuantity,
}: {
  clearCart: () => void;
  openCart: () => void;
  reviewState: CartReviewState;
  totalQuantity: number;
}) {
  return (
    <aside className="flex flex-col gap-case-md" data-checkout-cart-review>
      <div className="flex items-start justify-between gap-case-md">
        <div className="min-w-0">
          <h2 className="text-heading-2 font-semibold text-foreground">
            Cart review
          </h2>
          <p className="mt-case-xs text-small text-text-muted">
            {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
          </p>
        </div>
        <Badge
          variant={
            reviewState.status === "success"
              ? "success"
              : reviewState.status === "error"
                ? "error"
                : "neutral"
          }
        >
          {reviewState.status === "success"
            ? "Checked"
            : reviewState.status === "error"
              ? "Needs fix"
              : "Checking"}
        </Badge>
      </div>

      {reviewState.status === "loading" || reviewState.status === "idle" ? (
        <div className="flex flex-col gap-case-sm" data-checkout-review-loading>
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-14" />
        </div>
      ) : null}

      {reviewState.status === "error" ? (
        <div
          className="rounded-lg border border-border bg-surface p-case-lg"
          data-checkout-validation-error={reviewState.code}
        >
          <ErrorMessage>{reviewState.message}</ErrorMessage>
          <div className="mt-case-md grid gap-case-sm sm:grid-cols-2 lg:grid-cols-1">
            <Button type="button" variant="secondary" onClick={openCart}>
              Open cart
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={clearCart}
              data-checkout-clear-cart
            >
              Clear cart
            </Button>
          </div>
        </div>
      ) : null}

      {reviewState.status === "success" ? (
        <>
          <ul className="flex flex-col gap-case-sm">
            {reviewState.data.items.map((line) => {
              const category = line.category;

              return (
                <li
                  key={line.productId}
                  className="rounded-lg border border-border bg-surface p-case-md"
                  data-checkout-line-item={line.productId}
                >
                  <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-case-md">
                    <div className="aspect-square overflow-hidden rounded-md border border-border bg-surface-muted p-1">
                      <ProductVisual
                        categorySlug={category?.slug ?? "phone-cases"}
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${line.product.slug}`}
                        className="block truncate font-semibold text-foreground hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {line.product.name}
                      </Link>
                      <div className="mt-case-sm flex flex-wrap gap-case-xs">
                        {category ? (
                          <Badge variant="neutral" size="sm">
                            {category.name}
                          </Badge>
                        ) : null}
                        <Badge variant="success" size="sm">
                          {line.availableStock} left
                        </Badge>
                      </div>
                      <div className="mt-case-sm flex flex-wrap items-center justify-between gap-case-sm text-small">
                        <p className="text-text-muted">
                          {line.quantity} x {formatVnd(line.unitPrice)}
                        </p>
                        <p className="font-semibold text-foreground">
                          {formatVnd(line.lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <CheckoutOrderSummary data={reviewState.data} />
        </>
      ) : null}
    </aside>
  );
}

function CheckoutOrderSummary({ data }: { data: CartValidationData }) {
  const itemCount = getValidatedItemCount(data);

  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      aria-labelledby="checkout-order-summary-title"
      data-checkout-order-summary
    >
      <div className="flex items-start justify-between gap-case-md">
        <div className="min-w-0">
          <h3
            id="checkout-order-summary-title"
            className="text-heading-3 font-semibold text-foreground"
          >
            Order summary
          </h3>
          <p className="mt-case-xs text-small text-text-muted">
            Totals are recalculated after cart validation.
          </p>
        </div>
        <Badge variant="success" size="sm">
          Checked
        </Badge>
      </div>

      <dl className="mt-case-md flex flex-col divide-y divide-border">
        <div className="flex items-center justify-between gap-case-md pb-case-sm">
          <dt className="text-small text-text-muted">Items</dt>
          <dd
            className="text-small font-medium text-foreground"
            data-checkout-summary-items
          >
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-case-md py-case-sm">
          <dt className="text-small text-text-muted">Subtotal</dt>
          <dd
            className="text-small font-medium text-foreground"
            data-checkout-subtotal
            data-checkout-summary-subtotal
          >
            {formatVnd(data.subtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-case-md py-case-sm">
          <dt className="text-small text-text-muted">Shipping</dt>
          <dd
            className="text-small font-medium text-foreground"
            data-checkout-summary-shipping
          >
            {demoShippingLabel}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-case-md py-case-sm">
          <dt className="text-small text-text-muted">Payment</dt>
          <dd
            className="text-small font-medium text-foreground"
            data-checkout-summary-payment
          >
            {demoPaymentLabel}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-case-md pt-case-md">
          <dt className="font-semibold text-foreground">Order total</dt>
          <dd
            className="text-heading-3 font-semibold text-foreground"
            data-checkout-summary-total
          >
            {formatVnd(data.subtotal)}
          </dd>
        </div>
      </dl>

      <p className="mt-case-md border-t border-border pt-case-md text-small leading-6 text-text-muted">
        The next step can submit this as a simulated order without collecting
        payment details.
      </p>
    </section>
  );
}
