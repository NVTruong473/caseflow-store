"use client";

import Link from "next/link";
import * as React from "react";

import { Badge, Container, Skeleton } from "@/components/ui";
import {
  readCheckoutSuccessSnapshot,
  type CheckoutSuccessSnapshot,
} from "@/features/checkout/checkout-success-storage";
import { formatVnd } from "@/lib/format/currency";

type SuccessPageState =
  | { status: "loading" }
  | { status: "ready"; snapshot: CheckoutSuccessSnapshot }
  | { status: "missing"; orderCode: string | null };

export function CheckoutSuccessPage() {
  const [state, setState] = React.useState<SuccessPageState>({
    status: "loading",
  });

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const orderCode =
        new URLSearchParams(window.location.search).get("orderCode") ?? null;
      const snapshot = readCheckoutSuccessSnapshot(window.sessionStorage);

      if (snapshot && (!orderCode || snapshot.orderCode === orderCode)) {
        setState({ status: "ready", snapshot });
        return;
      }

      setState({ status: "missing", orderCode });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-checkout-success-page
    >
      <Container className="flex flex-col gap-case-xl">
        <Link
          href="/#products"
          className="w-fit text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Continue shopping
        </Link>

        {state.status === "loading" ? <CheckoutSuccessLoading /> : null}
        {state.status === "ready" ? (
          <CheckoutSuccessDetails snapshot={state.snapshot} />
        ) : null}
        {state.status === "missing" ? (
          <CheckoutSuccessMissing orderCode={state.orderCode} />
        ) : null}
      </Container>
    </main>
  );
}

function CheckoutSuccessLoading() {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-xl"
      data-checkout-success-loading
    >
      <Skeleton className="h-7 w-44" />
      <Skeleton className="mt-case-md h-12 w-full max-w-xl" />
      <div className="mt-case-lg grid gap-case-md md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </section>
  );
}

function CheckoutSuccessDetails({
  snapshot,
}: {
  snapshot: CheckoutSuccessSnapshot;
}) {
  return (
    <section className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <Badge variant="success">Order placed</Badge>
        <div className="mt-case-md max-w-3xl">
          <h1 className="text-heading-1 font-semibold text-foreground">
            Simulated order confirmed
          </h1>
          <p className="mt-case-sm text-body leading-7 text-text-muted">
            The order was created without collecting payment details. Keep the
            order code for support and admin review.
          </p>
        </div>

        <dl className="mt-case-xl divide-y divide-border border-y border-border bg-surface">
          <div className="flex flex-col gap-case-xs py-case-md sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-small text-text-muted">Order code</dt>
            <dd
              className="break-words font-semibold text-foreground"
              data-checkout-success-code
            >
              {snapshot.orderCode}
            </dd>
          </div>
          <div className="flex flex-col gap-case-xs py-case-md sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-small text-text-muted">Status</dt>
            <dd
              className="font-semibold capitalize text-foreground"
              data-checkout-success-status
            >
              {snapshot.status}
            </dd>
          </div>
          <div className="flex flex-col gap-case-xs py-case-md sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-small text-text-muted">Order total</dt>
            <dd
              className="text-heading-3 font-semibold text-foreground"
              data-checkout-success-total
            >
              {formatVnd(snapshot.subtotal)}
            </dd>
          </div>
        </dl>

        <div className="mt-case-xl">
          <h2 className="text-heading-2 font-semibold text-foreground">
            Items
          </h2>
          <ul
            className="mt-case-md divide-y divide-border border-y border-border"
            data-checkout-success-items
          >
            {snapshot.items.map((item) => (
              <li
                key={`${item.productName}-${item.quantity}-${item.lineTotal}`}
                className="flex items-center justify-between gap-case-md py-case-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {item.productName}
                  </p>
                  <p className="mt-case-xs text-small text-text-muted">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-foreground">
                  {formatVnd(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="rounded-lg border border-border bg-surface p-case-lg">
        <h2 className="text-heading-3 font-semibold text-foreground">
          Next steps
        </h2>
        <ul className="mt-case-md flex flex-col gap-case-sm text-small leading-6 text-text-muted">
          <li>Order status starts as pending for admin review.</li>
          <li>No card number, expiry date, or CVV was collected.</li>
          <li>Cart was cleared after the simulated order was created.</li>
        </ul>
        <div className="mt-case-lg grid gap-case-sm">
          <Link
            href="/#products"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Shop more products
          </Link>
          <Link
            href="/checkout"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View checkout
          </Link>
        </div>
      </aside>
    </section>
  );
}

function CheckoutSuccessMissing({ orderCode }: { orderCode: string | null }) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-xl"
      data-checkout-success-missing
    >
      <Badge variant="neutral">Order lookup unavailable</Badge>
      <div className="mt-case-md max-w-3xl">
        <h1 className="text-heading-1 font-semibold text-foreground">
          Order details are not available here
        </h1>
        <p className="mt-case-sm text-body leading-7 text-text-muted">
          This demo stores the success details in the current browser session.
          If the session data is cleared or the page is opened directly, the
          full order summary cannot be reconstructed without the later database
          integration.
        </p>
      </div>

      {orderCode ? (
        <dl className="mt-case-lg border-y border-border py-case-md">
          <dt className="text-small text-text-muted">Order code from URL</dt>
          <dd
            className="mt-case-xs break-words font-semibold text-foreground"
            data-checkout-success-code
          >
            {orderCode}
          </dd>
        </dl>
      ) : null}

      <div className="mt-case-lg flex flex-col gap-case-sm sm:flex-row">
        <Link
          href="/#products"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Continue shopping
        </Link>
        <Link
          href="/checkout"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Return to checkout
        </Link>
      </div>
    </section>
  );
}
