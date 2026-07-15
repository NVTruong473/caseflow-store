"use client";

import Link from "next/link";
import * as React from "react";

import {
  Badge,
  Button,
  Container,
  ErrorMessage,
  Skeleton,
} from "@/components/ui";
import { formatVnd } from "@/lib/format/currency";
import { cn } from "@/lib/utils/cn";
import {
  ORDER_STATUSES,
  type Order,
  type OrderItem,
  type OrderStatus,
} from "@/types/domain";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
};

type AdminOrderRecord = {
  order: Order;
  items: OrderItem[];
};

type AdminOrdersState =
  | { status: "auth-required"; message?: string }
  | { status: "loading" }
  | { status: "success"; orders: AdminOrderRecord[] }
  | { status: "error"; message: string };

type StatusUpdateState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type OrderSelectOptions = {
  focusDetail?: boolean;
};

const statusBadgeVariants: Record<
  OrderStatus,
  "neutral" | "primary" | "success" | "warning" | "error"
> = {
  pending: "warning",
  confirmed: "primary",
  shipping: "primary",
  completed: "success",
  cancelled: "error",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipping: "Shipping",
  completed: "Completed",
  cancelled: "Cancelled",
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AdminOrdersPage({ adminName }: { adminName: string }) {
  const detailPanelRef = React.useRef<HTMLElement | null>(null);
  const selectedOrderIdRef = React.useRef<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
    null,
  );
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [statusDraft, setStatusDraft] =
    React.useState<OrderStatus>("pending");
  const [statusUpdateState, setStatusUpdateState] =
    React.useState<StatusUpdateState>({ status: "idle" });
  const [state, setState] = React.useState<AdminOrdersState>({
    status: "loading",
  });

  const loadOrders = React.useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      if (options.showLoading ?? true) {
        setState({ status: "loading" });
      }

      try {
        const response = await fetch("/api/admin/orders");
        const payload = (await response.json()) as ApiResponse<
          AdminOrderRecord[]
        >;

        if (!response.ok || payload.error || !payload.data) {
          if (response.status === 401 || response.status === 403) {
            setState({
              status: "auth-required",
              message:
                payload.error?.message ?? "Admin authorization required.",
            });
            return;
          }

          setState({
            status: "error",
            message:
              payload.error?.message ?? "Admin orders could not be loaded.",
          });
          return;
        }

        const nextSelectedOrder =
          findOrderRecord(payload.data, selectedOrderIdRef.current) ??
          payload.data[0];

        selectedOrderIdRef.current = nextSelectedOrder?.order.id ?? null;
        setSelectedOrderId(nextSelectedOrder?.order.id ?? null);
        setStatusDraft(nextSelectedOrder?.order.status ?? "pending");
        setStatusUpdateState({ status: "idle" });
        setState({
          status: "success",
          orders: payload.data,
        });
      } catch {
        setState({
          status: "error",
          message: "Admin order service is unavailable.",
        });
      }
    },
    [],
  );

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const orders = state.status === "success" ? state.orders : [];
  const canRefresh =
    state.status === "success" ||
    state.status === "error" ||
    state.status === "loading";
  const selectedOrder =
    findOrderRecord(orders, selectedOrderId) ?? orders[0] ?? null;

  const focusDetailPanel = React.useCallback(() => {
    const panel = detailPanelRef.current;

    if (!panel) {
      return;
    }

    window.setTimeout(() => {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
      panel.focus({ preventScroll: true });
    }, 0);
  }, []);

  const handleSelectOrder = React.useCallback(
    (record: AdminOrderRecord, options: OrderSelectOptions = {}) => {
      selectedOrderIdRef.current = record.order.id;
      setSelectedOrderId(record.order.id);
      setStatusDraft(record.order.status);
      setStatusUpdateState({ status: "idle" });

      if (options.focusDetail) {
        focusDetailPanel();
      }
    },
    [focusDetailPanel],
  );

  const handleMobileDetailJump = React.useCallback(() => {
    focusDetailPanel();
  }, [focusDetailPanel]);

  const handleSignOut = React.useCallback(async () => {
    setIsSigningOut(true);

    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });

      if (!response.ok) {
        setState({
          status: "error",
          message: "Admin session could not be cleared.",
        });
        setIsSigningOut(false);
        return;
      }

      window.location.assign("/admin/login");
    } catch {
      setState({
        status: "error",
        message: "Admin session could not be cleared.",
      });
      setIsSigningOut(false);
    }
  }, []);

  const handleStatusSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedOrder) {
        return;
      }

      if (statusDraft === selectedOrder.order.status) {
        return;
      }

      setStatusUpdateState({ status: "submitting" });

      try {
        const response = await fetch(
          `/api/admin/orders/${selectedOrder.order.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: statusDraft }),
          },
        );
        const payload = (await response.json()) as ApiResponse<AdminOrderRecord>;

        if (!response.ok || payload.error || !payload.data) {
          if (response.status === 401 || response.status === 403) {
            setState({
              status: "auth-required",
              message:
                payload.error?.message ?? "Admin authorization required.",
            });
            return;
          }

          setStatusUpdateState({
            status: "error",
            message:
              payload.error?.message ?? "Order status could not be updated.",
          });
          return;
        }

        const updatedRecord = payload.data;

        selectedOrderIdRef.current = updatedRecord.order.id;
        setState((currentState) => {
          if (currentState.status !== "success") {
            return currentState;
          }

          return {
            ...currentState,
            orders: currentState.orders.map((record) =>
              record.order.id === updatedRecord.order.id
                ? updatedRecord
                : record,
            ),
          };
        });
        setSelectedOrderId(updatedRecord.order.id);
        setStatusDraft(updatedRecord.order.status);
        setStatusUpdateState({
          status: "success",
          message: `Status updated to ${statusLabels[updatedRecord.order.status]}.`,
        });
      } catch {
        setStatusUpdateState({
          status: "error",
          message: "Order status service is unavailable.",
        });
      }
    },
    [selectedOrder, statusDraft],
  );

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-admin-orders-page
    >
      <Container className="flex flex-col gap-case-xl">
        <section className="flex flex-col gap-case-lg lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-small font-medium text-text-muted">
              Signed in as {adminName}
            </p>
            <div className="mt-case-md flex max-w-3xl flex-col gap-case-sm">
              <Badge variant="primary">Admin workspace</Badge>
              <h1 className="text-heading-2 font-semibold text-foreground sm:text-heading-1">
                Orders
              </h1>
              <p className="text-body leading-7 text-text-muted">
                Review recent guest checkout orders and spot pending work.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-case-sm sm:flex-row lg:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadOrders()}
              disabled={!canRefresh || state.status === "loading"}
              isLoading={state.status === "loading"}
              data-admin-orders-refresh
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              isLoading={isSigningOut}
              data-admin-sign-out
            >
              Sign out
            </Button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Storefront
            </Link>
          </div>
        </section>

        {state.status === "auth-required" ? (
          <AdminOrdersAuthRequired message={state.message} />
        ) : null}
        {state.status === "loading" ? <AdminOrdersLoading /> : null}
        {state.status === "error" ? (
          <AdminOrdersError message={state.message} />
        ) : null}
        {state.status === "success" ? (
          <>
            <AdminOrdersSummary orders={orders} />
            {orders.length === 0 ? (
              <AdminOrdersEmpty />
            ) : (
              <div className="grid gap-case-md xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
                {selectedOrder ? (
                  <MobileSelectedOrderBar
                    record={selectedOrder}
                    onDetailJump={handleMobileDetailJump}
                  />
                ) : null}
                <AdminOrdersList
                  orders={orders}
                  selectedOrderId={selectedOrder?.order.id ?? null}
                  onSelectOrder={handleSelectOrder}
                />
                {selectedOrder ? (
                  <AdminOrderDetail
                    detailRef={detailPanelRef}
                    record={selectedOrder}
                    statusDraft={statusDraft}
                    statusUpdateState={statusUpdateState}
                    onStatusDraftChange={setStatusDraft}
                    onStatusSubmit={handleStatusSubmit}
                  />
                ) : null}
              </div>
            )}
          </>
        ) : null}
      </Container>
    </main>
  );
}

function AdminOrdersSummary({ orders }: { orders: AdminOrderRecord[] }) {
  const pendingCount = orders.filter(
    (record) => record.order.status === "pending",
  ).length;
  const totalRevenue = orders.reduce(
    (total, record) => total + record.order.subtotal,
    0,
  );
  const itemCount = orders.reduce(
    (total, record) => total + getOrderItemCount(record.items),
    0,
  );

  return (
    <dl
      className="grid grid-cols-2 gap-case-sm md:grid-cols-3"
      data-admin-orders-summary
    >
      <SummaryMetric label="Orders" value={orders.length.toString()} />
      <SummaryMetric label="Pending" value={pendingCount.toString()} />
      <SummaryMetric label="Items" value={itemCount.toString()} />
      <div className="col-span-2 rounded-md border border-border bg-surface p-case-md md:col-span-3">
        <dt className="text-small text-text-muted">Server total</dt>
        <dd
          className="mt-case-xs text-heading-3 font-semibold text-foreground"
          data-admin-orders-server-total
        >
          {formatVnd(totalRevenue)}
        </dd>
      </div>
    </dl>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-case-md">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-case-xs text-heading-3 font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function AdminOrdersList({
  orders,
  selectedOrderId,
  onSelectOrder,
}: {
  orders: AdminOrderRecord[];
  selectedOrderId: string | null;
  onSelectOrder: (record: AdminOrderRecord, options?: OrderSelectOptions) => void;
}) {
  return (
    <section
      id="admin-orders-list"
      className="scroll-mt-case-lg rounded-lg border border-border bg-surface"
      data-admin-orders-list
    >
      <div className="border-b border-border px-case-md py-case-md">
        <h2 className="text-heading-3 font-semibold text-foreground">
          Recent orders
        </h2>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-small">
          <thead className="bg-surface-muted text-text-muted">
            <tr>
              <TableHeader>Order</TableHeader>
              <TableHeader>Customer</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Total</TableHeader>
              <TableHeader>Items</TableHeader>
              <TableHeader>Created</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((record) => {
              const isSelected = record.order.id === selectedOrderId;

              return (
                <tr
                  key={record.order.id}
                  className={cn(
                    "transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-surface-muted",
                  )}
                  data-admin-order-row={record.order.id}
                  data-admin-order-selected={isSelected ? "true" : undefined}
                >
                  <TableCell>
                    <div className="grid gap-2">
                      <span
                        className="font-semibold text-foreground"
                        data-admin-order-code={record.order.orderCode}
                      >
                        {record.order.orderCode}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "primary" : "secondary"}
                        className="w-fit"
                        aria-pressed={isSelected}
                        onClick={() => onSelectOrder(record)}
                        data-admin-order-view={record.order.id}
                      >
                        {isSelected ? "Viewing" : "View"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {record.order.customerName}
                      </p>
                      <p className="mt-1 truncate text-text-muted">
                        {record.order.customerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={record.order.status} />
                  </TableCell>
                  <TableCell>
                    <span
                      className="font-semibold text-foreground"
                      data-admin-order-total={record.order.id}
                    >
                      {formatVnd(record.order.subtotal)}
                    </span>
                  </TableCell>
                  <TableCell>{getOrderItemCount(record.items)}</TableCell>
                  <TableCell>
                    {formatOrderDate(record.order.createdAt)}
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border lg:hidden">
        {orders.map((record) => {
          const isSelected = record.order.id === selectedOrderId;

          return (
            <li
              key={record.order.id}
              className={cn(
                "border-l-4 p-case-md transition-colors",
                isSelected
                  ? "border-l-primary bg-primary/5"
                  : "border-l-transparent bg-surface",
              )}
              data-admin-order-card={record.order.id}
              data-admin-order-selected={isSelected ? "true" : undefined}
            >
              <div className="flex items-start justify-between gap-case-sm">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-foreground">
                    {record.order.orderCode}
                  </p>
                  <p className="mt-1 text-small text-text-muted">
                    {formatOrderDate(record.order.createdAt)}
                  </p>
                </div>
                <OrderStatusBadge status={record.order.status} />
              </div>
              <dl className="mt-case-md grid grid-cols-3 gap-case-sm border-y border-border py-case-sm text-small">
                <MobileMetric label="Total" value={formatVnd(record.order.subtotal)} />
                <MobileMetric
                  label="Items"
                  value={getOrderItemCount(record.items).toString()}
                />
                <MobileMetric label="Customer" value={record.order.customerName} />
              </dl>
              <p className="mt-case-sm break-words text-small text-text-muted">
                {record.order.customerEmail}
              </p>
              <Button
                type="button"
                size="sm"
                variant={isSelected ? "primary" : "secondary"}
                className="mt-case-md w-full"
                aria-pressed={isSelected}
                onClick={() => onSelectOrder(record, { focusDetail: true })}
                data-admin-order-view={record.order.id}
              >
                {isSelected ? "Viewing details" : "View details"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MobileSelectedOrderBar({
  onDetailJump,
  record,
}: {
  onDetailJump: () => void;
  record: AdminOrderRecord;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-md lg:hidden"
      data-admin-mobile-selected-order
    >
      <div className="flex items-start justify-between gap-case-sm">
        <div className="min-w-0">
          <p className="text-small font-medium text-text-muted">Selected</p>
          <p className="mt-1 break-words text-body font-semibold text-foreground">
            {record.order.orderCode}
          </p>
          <p className="mt-1 text-small text-text-muted">
            {formatVnd(record.order.subtotal)} · {getOrderItemCount(record.items)}{" "}
            items
          </p>
        </div>
        <OrderStatusBadge status={record.order.status} />
      </div>
      <div className="mt-case-md grid grid-cols-2 gap-case-sm">
        <a
          href="#admin-orders-list"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-small font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Orders
        </a>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onDetailJump}
          data-admin-mobile-detail-jump
        >
          Detail
        </Button>
      </div>
    </section>
  );
}

function AdminOrderDetail({
  detailRef,
  record,
  statusDraft,
  statusUpdateState,
  onStatusDraftChange,
  onStatusSubmit,
}: {
  detailRef: React.Ref<HTMLElement>;
  record: AdminOrderRecord;
  statusDraft: OrderStatus;
  statusUpdateState: StatusUpdateState;
  onStatusDraftChange: (status: OrderStatus) => void;
  onStatusSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isSubmitting = statusUpdateState.status === "submitting";
  const hasStatusChange = statusDraft !== record.order.status;
  const statusSelectId = `admin-order-status-${record.order.id}`;

  return (
    <aside
      id="admin-order-detail-panel"
      ref={detailRef}
      tabIndex={-1}
      className="scroll-mt-case-lg rounded-lg border border-border bg-surface p-case-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      data-admin-order-detail
    >
      <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Badge variant="neutral">Selected order</Badge>
          <h2
            className="mt-case-sm break-words text-heading-3 font-semibold text-foreground"
            data-admin-order-detail-code={record.order.orderCode}
          >
            {record.order.orderCode}
          </h2>
          <p className="mt-1 text-small text-text-muted">
            Created {formatOrderDate(record.order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={record.order.status} />
      </div>

      <form
        className="mt-case-lg grid gap-case-sm rounded-md border border-border bg-surface-muted p-case-md"
        onSubmit={onStatusSubmit}
        data-admin-order-status-form
      >
        <label
          htmlFor={statusSelectId}
          className="text-small font-medium text-foreground"
        >
          Update status
        </label>
        <div className="grid gap-case-sm sm:grid-cols-[minmax(0,1fr)_auto]">
          <select
            id={statusSelectId}
            value={statusDraft}
            data-admin-order-status-select
            disabled={isSubmitting}
            onChange={(event) =>
              onStatusDraftChange(event.target.value as OrderStatus)
            }
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <Button
            type="submit"
            className="sm:min-w-32"
            disabled={!hasStatusChange || isSubmitting}
            isLoading={isSubmitting}
            data-admin-order-status-submit
          >
            Update
          </Button>
        </div>
        {statusUpdateState.status === "success" ? (
          <p
            className="text-small font-medium text-success"
            data-admin-order-status-success
          >
            {statusUpdateState.message}
          </p>
        ) : null}
        {statusUpdateState.status === "error" ? (
          <ErrorMessage data-admin-order-status-error>
            {statusUpdateState.message}
          </ErrorMessage>
        ) : null}
      </form>

      <dl className="mt-case-lg grid gap-case-sm text-small">
        <DetailRow label="Customer">{record.order.customerName}</DetailRow>
        <DetailRow label="Email">{record.order.customerEmail}</DetailRow>
        <DetailRow label="Phone">{record.order.customerPhone}</DetailRow>
        <DetailRow label="Shipping">{record.order.shippingAddress}</DetailRow>
        <DetailRow label="Updated">
          {formatOrderDate(record.order.updatedAt)}
        </DetailRow>
        <DetailRow label="Total">{formatVnd(record.order.subtotal)}</DetailRow>
      </dl>

      <div className="mt-case-lg">
        <h3 className="text-small font-semibold uppercase tracking-normal text-text-muted">
          Items
        </h3>
        <ul
          className="mt-case-sm divide-y divide-border rounded-md border border-border"
          data-admin-order-detail-items
        >
          {record.items.map((item) => (
            <li key={item.id} className="grid gap-1 p-case-sm text-small">
              <div className="flex min-w-0 items-start justify-between gap-case-sm">
                <span className="min-w-0 break-words font-medium text-foreground">
                  {item.productName}
                </span>
                <span className="shrink-0 font-semibold text-foreground">
                  {formatVnd(item.lineTotal)}
                </span>
              </div>
              <p className="text-text-muted">
                {item.quantity} x {formatVnd(item.unitPrice)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-case-md py-case-sm font-semibold uppercase tracking-normal">
      {children}
    </th>
  );
}

function TableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-case-md py-case-md align-top", className)}>
      {children}
    </td>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-text-muted">{label}</dt>
      <dd className="mt-1 min-w-0 break-words font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge
      variant={statusBadgeVariants[status]}
      data-admin-order-status={status}
    >
      {statusLabels[status]}
    </Badge>
  );
}

function DetailRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-case-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}

function AdminOrdersAuthRequired({ message }: { message?: string }) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-admin-orders-auth-required
    >
      <Badge variant="warning">Admin session required</Badge>
      <div className="mt-case-md max-w-xl">
        <h2 className="text-heading-2 font-semibold text-foreground">
          Verify admin access
        </h2>
        <p className="mt-case-sm text-body leading-7 text-text-muted">
          {message ?? "The order list needs a verified admin session."}
        </p>
      </div>
      <Link
        href="/admin/login"
        className="mt-case-lg inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Go to admin login
      </Link>
    </section>
  );
}

function AdminOrdersLoading() {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-admin-orders-loading
    >
      <Skeleton className="h-7 w-44" />
      <div className="mt-case-lg grid gap-case-sm md:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="mt-case-lg h-64" />
    </section>
  );
}

function AdminOrdersError({ message }: { message: string }) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-admin-orders-error
    >
      <ErrorMessage>{message}</ErrorMessage>
    </section>
  );
}

function AdminOrdersEmpty() {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-admin-orders-empty
    >
      <Badge variant="neutral">No orders</Badge>
      <div className="mt-case-md max-w-xl">
        <h2 className="text-heading-2 font-semibold text-foreground">
          No guest orders yet
        </h2>
        <p className="mt-case-sm text-body leading-7 text-text-muted">
          New checkout submissions will appear here after the order API creates
          them.
        </p>
      </div>
    </section>
  );
}

function getOrderItemCount(items: OrderItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function findOrderRecord(orders: AdminOrderRecord[], orderId: string | null) {
  if (!orderId) {
    return null;
  }

  return orders.find((record) => record.order.id === orderId) ?? null;
}

function formatOrderDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return dateTimeFormatter.format(date);
}
