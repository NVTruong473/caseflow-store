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
import type { Language } from "@/lib/i18n/language";
import { cn } from "@/lib/utils/cn";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SHIPPING_STATUSES,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentStatus,
  type ShippingMethod,
  type ShippingStatus,
} from "@/types/domain";
import type { AdminWorkspaceRole } from "@/lib/auth/admin";
import type { AdminPermission } from "@/lib/auth/admin";

import { AdminOperationsNavigation } from "./admin-navigation";
import { AdminOperationsRail } from "./admin-shell-page";

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
  operations: {
    paymentStatus: PaymentStatus;
    shippingMethod: ShippingMethod;
    shippingStatus: ShippingStatus;
    internalNotes: string;
  };
  transitions: {
    orderStatus: OrderStatus[];
    paymentStatus: PaymentStatus[];
    shippingStatus: ShippingStatus[];
  };
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

type OrderFilters = {
  q: string;
  status: OrderStatus | "all";
  paymentStatus: PaymentStatus | "all";
  shippingStatus: ShippingStatus | "all";
};

type OrderOperationsDraft = {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  internalNotes: string;
};

const defaultOrderFilters: OrderFilters = {
  paymentStatus: "all",
  q: "",
  shippingStatus: "all",
  status: "all",
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

const statusLabelsByLanguage: Record<Language, Record<OrderStatus, string>> = {
  en: {
    pending: "Pending",
    confirmed: "Confirmed",
    shipping: "Shipping",
    completed: "Completed",
    cancelled: "Rejected / cancelled",
  },
  vi: {
    pending: "Đang chờ",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Từ chối / hủy",
  },
};

const paymentStatusLabelsByLanguage: Record<
  Language,
  Record<PaymentStatus, string>
> = {
  en: {
    pending: "Pending",
    "awaiting-transfer": "Awaiting transfer",
    "awaiting-provider-confirmation": "Awaiting provider",
    confirmed: "Confirmed",
    expired: "Expired",
    failed: "Failed",
    cancelled: "Cancelled",
  },
  vi: {
    pending: "Đang chờ",
    "awaiting-transfer": "Chờ chuyển khoản",
    "awaiting-provider-confirmation": "Chờ nhà cung cấp",
    confirmed: "Đã xác nhận",
    expired: "Đã hết hạn",
    failed: "Thất bại",
    cancelled: "Đã hủy",
  },
};

const shippingStatusLabelsByLanguage: Record<
  Language,
  Record<ShippingStatus, string>
> = {
  en: {
    pending: "Pending",
    preparing: "Preparing",
    shipped: "Shipped",
    delivered: "Delivered",
    returned: "Returned",
    cancelled: "Cancelled",
  },
  vi: {
    pending: "Đang chờ",
    preparing: "Đang chuẩn bị",
    shipped: "Đã giao cho vận chuyển",
    delivered: "Đã giao",
    returned: "Đã hoàn",
    cancelled: "Đã hủy",
  },
};

const adminOrdersCopy = {
  en: {
    adminAuthorizationRequired: "Operations authorization required.",
    adminOrderServiceUnavailable: "Operations order service is unavailable.",
    adminOrdersCouldNotBeLoaded: "Operations orders could not be loaded.",
    adminSessionCouldNotBeCleared: "Operations session could not be cleared.",
    adminWorkspace: "Operations workspace",
    authBadge: "Operations session required",
    authDefaultMessage: "The order list needs a verified staff or admin session.",
    authTitle: "Verify operations access",
    created: "Created",
    customer: "Customer",
    detail: "Detail",
    email: "Email",
    all: "All",
    applyFilters: "Apply filters",
    clearFilters: "Clear",
    filterOrders: "Filter orders",
    goToAdminLogin: "Go to admin login",
    internalNotes: "Internal notes",
    invalidDate: "Invalid date",
    items: "Items",
    noOrders: "No orders",
    noOrdersDescription:
      "New checkout submissions will appear here after the order API creates them.",
    noOrdersTitle: "No guest orders yet",
    order: "Order",
    orderStatusCouldNotBeUpdated: "Order status could not be updated.",
    orderStatusServiceUnavailable: "Order status service is unavailable.",
    orders: "Orders",
    pageDescription: "Review recent checkout orders and spot pending work.",
    pending: "Pending",
    phone: "Phone",
    rejectionHint:
      "Use rejected/cancelled when the order has fraud risk, invalid contact, unavailable stock, or another operations issue.",
    paymentStatus: "Payment status",
    recentOrders: "Recent orders",
    refresh: "Refresh",
    selected: "Selected",
    selectedOrder: "Selected order",
    serverTotal: "Server total",
    shipping: "Shipping",
    shippingStatus: "Shipping status",
    searchOrders: "Search code, customer, phone, notes",
    signOut: "Sign out",
    signedInAs: (name: string) => `Signed in as ${name}`,
    roleLabel: "Workspace role",
    roleNames: {
      admin: "Admin",
      staff: "Staff",
    },
    status: "Status",
    operationsUpdated: "Order operations saved.",
    statusUpdated: (label: string) => `Status updated to ${label}.`,
    storefront: "Storefront",
    total: "Total",
    update: "Update",
    updated: "Updated",
    updateStatus: "Update operations",
    view: "View",
    viewing: "Viewing",
    viewDetails: "View details",
    viewingDetails: "Viewing details",
  },
  vi: {
    adminAuthorizationRequired: "Cần quyền vận hành.",
    adminOrderServiceUnavailable: "Dịch vụ đơn hàng vận hành chưa khả dụng.",
    adminOrdersCouldNotBeLoaded: "Không thể tải danh sách đơn hàng vận hành.",
    adminSessionCouldNotBeCleared: "Không thể xóa phiên vận hành.",
    adminWorkspace: "Khu vực vận hành",
    authBadge: "Cần phiên vận hành",
    authDefaultMessage:
      "Danh sách đơn hàng cần phiên staff hoặc admin đã xác thực.",
    authTitle: "Xác minh quyền vận hành",
    created: "Ngày tạo",
    customer: "Khách hàng",
    detail: "Chi tiết",
    email: "Email",
    all: "Tất cả",
    applyFilters: "Lọc đơn",
    clearFilters: "Xóa lọc",
    filterOrders: "Lọc đơn hàng",
    goToAdminLogin: "Tới đăng nhập admin",
    internalNotes: "Ghi chú nội bộ",
    invalidDate: "Ngày không hợp lệ",
    items: "Sản phẩm",
    noOrders: "Chưa có đơn",
    noOrdersDescription:
      "Đơn checkout mới sẽ xuất hiện ở đây sau khi API đơn hàng tạo bản ghi.",
    noOrdersTitle: "Chưa có đơn hàng khách",
    order: "Đơn hàng",
    orderStatusCouldNotBeUpdated: "Không thể cập nhật trạng thái đơn hàng.",
    orderStatusServiceUnavailable:
      "Dịch vụ trạng thái đơn hàng chưa khả dụng.",
    orders: "Đơn hàng",
    pageDescription: "Xem đơn hàng gần đây và phát hiện việc cần xử lý.",
    pending: "Đang chờ",
    phone: "Số điện thoại",
    rejectionHint:
      "Dùng từ chối/hủy khi đơn có rủi ro, liên hệ không hợp lệ, thiếu tồn kho hoặc vấn đề vận hành khác.",
    paymentStatus: "Trạng thái thanh toán",
    recentOrders: "Đơn hàng gần đây",
    refresh: "Làm mới",
    selected: "Đang chọn",
    selectedOrder: "Đơn đang chọn",
    serverTotal: "Tổng từ server",
    shipping: "Giao hàng",
    shippingStatus: "Trạng thái giao hàng",
    searchOrders: "Tìm mã, khách, số điện thoại, ghi chú",
    signOut: "Đăng xuất",
    signedInAs: (name: string) => `Đã đăng nhập: ${name}`,
    roleLabel: "Vai trò",
    roleNames: {
      admin: "Admin",
      staff: "Staff",
    },
    status: "Trạng thái",
    operationsUpdated: "Đã lưu vận hành đơn hàng.",
    statusUpdated: (label: string) => `Đã cập nhật trạng thái thành ${label}.`,
    storefront: "Cửa hàng",
    total: "Tổng",
    update: "Cập nhật",
    updated: "Cập nhật",
    updateStatus: "Cập nhật vận hành",
    view: "Xem",
    viewing: "Đang xem",
    viewDetails: "Xem chi tiết",
    viewingDetails: "Đang xem chi tiết",
  },
} as const;

export function AdminOrdersPage({
  adminName,
  adminPermissions,
  adminRole,
  language,
}: {
  adminName: string;
  adminPermissions: AdminPermission[];
  adminRole: AdminWorkspaceRole;
  language: Language;
}) {
  const copy = adminOrdersCopy[language];
  const statusLabels = statusLabelsByLanguage[language];
  const detailPanelRef = React.useRef<HTMLElement | null>(null);
  const selectedOrderIdRef = React.useRef<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
    null,
  );
  const [filterDraft, setFilterDraft] =
    React.useState<OrderFilters>(defaultOrderFilters);
  const [filters, setFilters] =
    React.useState<OrderFilters>(defaultOrderFilters);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [operationsDraft, setOperationsDraft] =
    React.useState<OrderOperationsDraft>({
      internalNotes: "",
      orderStatus: "pending",
      paymentStatus: "pending",
      shippingStatus: "pending",
    });
  const [statusUpdateState, setStatusUpdateState] =
    React.useState<StatusUpdateState>({ status: "idle" });
  const [state, setState] = React.useState<AdminOrdersState>({
    status: "loading",
  });

  const loadOrders = React.useCallback(
    async (
      options: { filters?: OrderFilters; showLoading?: boolean } = {},
    ) => {
      if (options.showLoading ?? true) {
        setState({ status: "loading" });
      }

      try {
        const response = await fetch(
          buildAdminOrdersUrl(options.filters ?? filters),
        );
        const payload = (await response.json()) as ApiResponse<
          AdminOrderRecord[]
        >;

        if (!response.ok || payload.error || !payload.data) {
          if (response.status === 401 || response.status === 403) {
            setState({
              status: "auth-required",
              message:
                payload.error?.message ?? copy.adminAuthorizationRequired,
            });
            return;
          }

          setState({
            status: "error",
            message:
              payload.error?.message ?? copy.adminOrdersCouldNotBeLoaded,
          });
          return;
        }

        const nextSelectedOrder =
          findOrderRecord(payload.data, selectedOrderIdRef.current) ??
          payload.data[0];

        selectedOrderIdRef.current = nextSelectedOrder?.order.id ?? null;
        setSelectedOrderId(nextSelectedOrder?.order.id ?? null);
        setOperationsDraft(getOperationsDraft(nextSelectedOrder));
        setStatusUpdateState({ status: "idle" });
        setState({
          status: "success",
          orders: payload.data,
        });
      } catch {
        setState({
          status: "error",
          message: copy.adminOrderServiceUnavailable,
        });
      }
    },
    [
      copy.adminAuthorizationRequired,
      copy.adminOrderServiceUnavailable,
      copy.adminOrdersCouldNotBeLoaded,
      filters,
    ],
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
      setOperationsDraft(getOperationsDraft(record));
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

  const handleFilterSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFilters(filterDraft);
      void loadOrders({ filters: filterDraft });
    },
    [filterDraft, loadOrders],
  );

  const handleClearFilters = React.useCallback(() => {
    setFilterDraft(defaultOrderFilters);
    setFilters(defaultOrderFilters);
    void loadOrders({ filters: defaultOrderFilters });
  }, [loadOrders]);

  const handleSignOut = React.useCallback(async () => {
    setIsSigningOut(true);

    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });

      if (!response.ok) {
        setState({
          status: "error",
          message: copy.adminSessionCouldNotBeCleared,
        });
        setIsSigningOut(false);
        return;
      }

      window.location.assign("/admin/login");
    } catch {
      setState({
        status: "error",
        message: copy.adminSessionCouldNotBeCleared,
      });
      setIsSigningOut(false);
    }
  }, [copy.adminSessionCouldNotBeCleared]);

  const handleStatusSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedOrder) {
        return;
      }

      if (!hasOperationsChanges(operationsDraft, selectedOrder)) {
        return;
      }

      setStatusUpdateState({ status: "submitting" });

      try {
        const response = await fetch(
          `/api/admin/orders/${selectedOrder.order.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              internalNotes: operationsDraft.internalNotes,
              paymentStatus: operationsDraft.paymentStatus,
              shippingStatus: operationsDraft.shippingStatus,
              status: operationsDraft.orderStatus,
            }),
          },
        );
        const payload = (await response.json()) as ApiResponse<AdminOrderRecord>;

        if (!response.ok || payload.error || !payload.data) {
          if (response.status === 401 || response.status === 403) {
            setState({
              status: "auth-required",
              message:
                payload.error?.message ?? copy.adminAuthorizationRequired,
            });
            return;
          }

          setStatusUpdateState({
            status: "error",
            message:
              payload.error?.message ?? copy.orderStatusCouldNotBeUpdated,
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
        setOperationsDraft(getOperationsDraft(updatedRecord));
        setStatusUpdateState({
          status: "success",
          message:
            operationsDraft.orderStatus !== selectedOrder.order.status
              ? copy.statusUpdated(statusLabels[updatedRecord.order.status])
              : copy.operationsUpdated,
        });
      } catch {
        setStatusUpdateState({
          status: "error",
          message: copy.orderStatusServiceUnavailable,
        });
      }
    },
    [
      copy,
      operationsDraft,
      selectedOrder,
      statusLabels,
    ],
  );

  return (
    <main
      className="bg-admin-muted py-case-2xl text-foreground"
      data-admin-orders-page
      data-admin-workspace-role={adminRole}
    >
      <Container className="flex flex-col gap-case-lg">
        <section className="flex flex-col gap-case-lg rounded-lg border border-admin/20 bg-surface p-case-lg shadow-[var(--case-shadow-soft)] lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-small font-medium text-text-muted">
              {copy.signedInAs(adminName)}
            </p>
            <div className="mt-case-md flex max-w-3xl flex-col gap-case-sm">
              <div className="flex flex-wrap gap-case-sm">
                <Badge variant="primary">{copy.adminWorkspace}</Badge>
                <Badge variant="neutral" data-admin-role-badge={adminRole}>
                  {copy.roleLabel}: {copy.roleNames[adminRole]}
                </Badge>
              </div>
              <h1 className="text-heading-2 font-semibold text-foreground sm:text-heading-1">
                {copy.orders}
              </h1>
              <p className="text-body leading-7 text-text-muted">
                {copy.pageDescription}
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
              {copy.refresh}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              isLoading={isSigningOut}
              data-admin-sign-out
            >
              {copy.signOut}
            </Button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-admin/20 bg-admin px-4 py-2 text-body font-medium text-surface transition-colors hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {copy.storefront}
            </Link>
          </div>
        </section>

        <AdminOperationsNavigation
          active="orders"
          language={language}
          permissions={adminPermissions}
          role={adminRole}
        />

        <AdminOperationsRail
          active="orders"
          language={language}
          metricsCount={state.status === "success" ? 4 : 0}
          permissions={adminPermissions}
          role={adminRole}
        />

        {state.status === "auth-required" ? (
          <AdminOrdersAuthRequired copy={copy} message={state.message} />
        ) : null}
        {state.status === "loading" ? <AdminOrdersLoading /> : null}
        {state.status === "error" ? (
          <AdminOrdersError message={state.message} />
        ) : null}
        {state.status === "success" ? (
          <>
            <AdminOrdersFilters
              copy={copy}
              filterDraft={filterDraft}
              language={language}
              onClearFilters={handleClearFilters}
              onFilterDraftChange={setFilterDraft}
              onFilterSubmit={handleFilterSubmit}
            />
            <AdminOrdersSummary copy={copy} orders={orders} />
            {orders.length === 0 ? (
              <AdminOrdersEmpty copy={copy} />
            ) : (
              <div className="grid gap-case-md 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:items-start">
                {selectedOrder ? (
                  <MobileSelectedOrderBar
                    copy={copy}
                    language={language}
                    record={selectedOrder}
                    onDetailJump={handleMobileDetailJump}
                  />
                ) : null}
                <AdminOrdersList
                  orders={orders}
                  copy={copy}
                  language={language}
                  selectedOrderId={selectedOrder?.order.id ?? null}
                  onSelectOrder={handleSelectOrder}
                />
                {selectedOrder ? (
                  <AdminOrderDetail
                    copy={copy}
                    detailRef={detailPanelRef}
                    language={language}
                    operationsDraft={operationsDraft}
                    record={selectedOrder}
                    statusUpdateState={statusUpdateState}
                    onOperationsDraftChange={setOperationsDraft}
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

function AdminOrdersFilters({
  copy,
  filterDraft,
  language,
  onClearFilters,
  onFilterDraftChange,
  onFilterSubmit,
}: {
  copy: (typeof adminOrdersCopy)[Language];
  filterDraft: OrderFilters;
  language: Language;
  onClearFilters: () => void;
  onFilterDraftChange: React.Dispatch<React.SetStateAction<OrderFilters>>;
  onFilterSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="grid gap-case-md rounded-lg border border-admin/20 bg-surface p-case-md shadow-[var(--case-shadow-soft)]"
      onSubmit={onFilterSubmit}
      data-admin-orders-filters
    >
      <div className="flex flex-col gap-case-sm md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-heading-3 font-semibold text-foreground">
            {copy.filterOrders}
          </h2>
        </div>
        <div className="flex gap-case-sm">
          <Button type="submit" data-admin-orders-filter-apply>
            {copy.applyFilters}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClearFilters}
            data-admin-orders-filter-clear
          >
            {copy.clearFilters}
          </Button>
        </div>
      </div>

      <div className="grid gap-case-sm lg:grid-cols-[minmax(220px,1.4fr)_repeat(3,minmax(0,1fr))]">
        <label className="grid gap-1 text-small font-medium text-foreground">
          <span>{copy.searchOrders}</span>
          <input
            type="search"
            value={filterDraft.q}
            onChange={(event) =>
              onFilterDraftChange((current) => ({
                ...current,
                q: event.target.value,
              }))
            }
            className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-admin-orders-filter-search
          />
        </label>

        <FilterSelect
          label={copy.status}
          value={filterDraft.status}
          onChange={(value) =>
            onFilterDraftChange((current) => ({
              ...current,
              status: value as OrderFilters["status"],
            }))
          }
          dataAttribute="data-admin-orders-filter-status"
        >
          <option value="all">{copy.all}</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabelsByLanguage[language][status]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label={copy.paymentStatus}
          value={filterDraft.paymentStatus}
          onChange={(value) =>
            onFilterDraftChange((current) => ({
              ...current,
              paymentStatus: value as OrderFilters["paymentStatus"],
            }))
          }
          dataAttribute="data-admin-orders-filter-payment-status"
        >
          <option value="all">{copy.all}</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {paymentStatusLabelsByLanguage[language][status]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label={copy.shippingStatus}
          value={filterDraft.shippingStatus}
          onChange={(value) =>
            onFilterDraftChange((current) => ({
              ...current,
              shippingStatus: value as OrderFilters["shippingStatus"],
            }))
          }
          dataAttribute="data-admin-orders-filter-shipping-status"
        >
          <option value="all">{copy.all}</option>
          {SHIPPING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {shippingStatusLabelsByLanguage[language][status]}
            </option>
          ))}
        </FilterSelect>
      </div>
    </form>
  );
}

function FilterSelect({
  children,
  dataAttribute,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  dataAttribute: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-small font-medium text-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        {...{ [dataAttribute]: true }}
      >
        {children}
      </select>
    </label>
  );
}

function AdminOrdersSummary({
  copy,
  orders,
}: {
  copy: (typeof adminOrdersCopy)[Language];
  orders: AdminOrderRecord[];
}) {
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
      <SummaryMetric label={copy.orders} value={orders.length.toString()} />
      <SummaryMetric label={copy.pending} value={pendingCount.toString()} />
      <SummaryMetric label={copy.items} value={itemCount.toString()} />
      <div className="relative col-span-2 overflow-hidden rounded-md border border-admin/20 bg-surface p-case-md pl-case-lg md:col-span-3">
        <span className="absolute inset-y-0 left-0 w-1 bg-admin" />
        <dt className="text-small text-text-muted">{copy.serverTotal}</dt>
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
    <div className="relative overflow-hidden rounded-md border border-admin/20 bg-surface p-case-md pl-case-lg">
      <span className="absolute inset-y-0 left-0 w-1 bg-admin" />
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-case-xs text-heading-3 font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function AdminOrdersList({
  copy,
  language,
  orders,
  selectedOrderId,
  onSelectOrder,
}: {
  copy: (typeof adminOrdersCopy)[Language];
  language: Language;
  orders: AdminOrderRecord[];
  selectedOrderId: string | null;
  onSelectOrder: (record: AdminOrderRecord, options?: OrderSelectOptions) => void;
}) {
  return (
    <section
      id="admin-orders-list"
      className="scroll-mt-case-lg rounded-lg border border-admin/20 bg-surface shadow-[var(--case-shadow-soft)]"
      data-admin-orders-list
    >
      <div className="border-b border-border px-case-md py-case-md">
        <h2 className="text-heading-3 font-semibold text-foreground">
          {copy.recentOrders}
        </h2>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-small">
          <thead className="bg-surface-muted text-text-muted">
            <tr>
              <TableHeader>{copy.order}</TableHeader>
              <TableHeader>{copy.customer}</TableHeader>
              <TableHeader>{copy.status}</TableHeader>
              <TableHeader>{copy.total}</TableHeader>
              <TableHeader>{copy.items}</TableHeader>
              <TableHeader>{copy.created}</TableHeader>
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
                        {isSelected ? copy.viewing : copy.view}
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
                    <OrderOperationsStatusStack
                      copy={copy}
                      language={language}
                      record={record}
                    />
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
                    {formatOrderDate(record.order.createdAt, language)}
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
                    {formatOrderDate(record.order.createdAt, language)}
                  </p>
                </div>
                <OrderStatusBadge language={language} status={record.order.status} />
              </div>
              <dl className="mt-case-md grid grid-cols-3 gap-case-sm border-y border-border py-case-sm text-small">
                <MobileMetric label={copy.total} value={formatVnd(record.order.subtotal)} />
                <MobileMetric
                  label={copy.items}
                  value={getOrderItemCount(record.items).toString()}
                />
                <MobileMetric label={copy.customer} value={record.order.customerName} />
              </dl>
              <p className="mt-case-sm break-words text-small text-text-muted">
                {record.order.customerEmail}
              </p>
              <div className="mt-case-sm flex flex-wrap gap-case-xs text-small text-text-muted">
                <span data-admin-order-payment-status={record.operations.paymentStatus}>
                  {copy.paymentStatus}:{" "}
                  {
                    paymentStatusLabelsByLanguage[language][
                      record.operations.paymentStatus
                    ]
                  }
                </span>
                <span data-admin-order-shipping-status={record.operations.shippingStatus}>
                  {copy.shippingStatus}:{" "}
                  {
                    shippingStatusLabelsByLanguage[language][
                      record.operations.shippingStatus
                    ]
                  }
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant={isSelected ? "primary" : "secondary"}
                className="mt-case-md w-full"
                aria-pressed={isSelected}
                onClick={() => onSelectOrder(record, { focusDetail: true })}
                data-admin-order-view={record.order.id}
              >
                {isSelected ? copy.viewingDetails : copy.viewDetails}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MobileSelectedOrderBar({
  copy,
  language,
  onDetailJump,
  record,
}: {
  copy: (typeof adminOrdersCopy)[Language];
  language: Language;
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
          <p className="text-small font-medium text-text-muted">{copy.selected}</p>
          <p className="mt-1 break-words text-body font-semibold text-foreground">
            {record.order.orderCode}
          </p>
          <p className="mt-1 text-small text-text-muted">
            {formatVnd(record.order.subtotal)} · {getOrderItemCount(record.items)}{" "}
            {copy.items}
          </p>
        </div>
        <OrderStatusBadge language={language} status={record.order.status} />
      </div>
      <div className="mt-case-md grid grid-cols-2 gap-case-sm">
        <a
          href="#admin-orders-list"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-small font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.orders}
        </a>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onDetailJump}
          data-admin-mobile-detail-jump
        >
          {copy.detail}
        </Button>
      </div>
    </section>
  );
}

function AdminOrderDetail({
  copy,
  detailRef,
  language,
  operationsDraft,
  record,
  statusUpdateState,
  onOperationsDraftChange,
  onStatusSubmit,
}: {
  copy: (typeof adminOrdersCopy)[Language];
  detailRef: React.Ref<HTMLElement>;
  language: Language;
  operationsDraft: OrderOperationsDraft;
  record: AdminOrderRecord;
  statusUpdateState: StatusUpdateState;
  onOperationsDraftChange: React.Dispatch<
    React.SetStateAction<OrderOperationsDraft>
  >;
  onStatusSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isSubmitting = statusUpdateState.status === "submitting";
  const hasOperationsChange = hasOperationsChanges(operationsDraft, record);
  const statusSelectId = `admin-order-status-${record.order.id}`;
  const paymentStatusSelectId = `admin-order-payment-status-${record.order.id}`;
  const shippingStatusSelectId = `admin-order-shipping-status-${record.order.id}`;
  const internalNotesId = `admin-order-internal-notes-${record.order.id}`;
  const statusLabels = statusLabelsByLanguage[language];
  const paymentStatusLabels = paymentStatusLabelsByLanguage[language];
  const shippingStatusLabels = shippingStatusLabelsByLanguage[language];

  return (
    <aside
      id="admin-order-detail-panel"
      ref={detailRef}
      tabIndex={-1}
      className="scroll-mt-case-lg rounded-lg border border-operations/25 bg-operations-muted p-case-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      data-admin-order-detail
    >
      <div className="flex flex-col gap-case-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Badge variant="neutral">{copy.selectedOrder}</Badge>
          <h2
            className="mt-case-sm break-words text-heading-3 font-semibold text-foreground"
            data-admin-order-detail-code={record.order.orderCode}
          >
            {record.order.orderCode}
          </h2>
          <p className="mt-1 text-small text-text-muted">
            {copy.created} {formatOrderDate(record.order.createdAt, language)}
          </p>
        </div>
        <OrderStatusBadge language={language} status={record.order.status} />
      </div>

      <form
        className="mt-case-lg grid gap-case-md rounded-md border border-admin/20 bg-surface p-case-md"
        onSubmit={onStatusSubmit}
        data-admin-order-status-form
      >
        <h3 className="text-small font-semibold uppercase tracking-normal text-text-muted">
          {copy.updateStatus}
        </h3>
        <p className="text-small leading-6 text-text-muted">
          {copy.rejectionHint}
        </p>
        <div className="grid gap-case-sm">
          <label className="grid gap-1 text-small font-medium text-foreground">
            <span>{copy.status}</span>
            <select
              id={statusSelectId}
              value={operationsDraft.orderStatus}
              data-admin-order-status-select
              disabled={isSubmitting}
              onChange={(event) =>
                onOperationsDraftChange((current) =>
                  normalizeOperationsDraftForOrderStatus(
                    current,
                    event.target.value as OrderStatus,
                  ),
                )
              }
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70"
            >
              {record.transitions.orderStatus.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-small font-medium text-foreground">
            <span>{copy.paymentStatus}</span>
            <select
              id={paymentStatusSelectId}
              value={operationsDraft.paymentStatus}
              data-admin-order-payment-status-select
              disabled={isSubmitting}
              onChange={(event) =>
                onOperationsDraftChange((current) => ({
                  ...current,
                  paymentStatus: event.target.value as PaymentStatus,
                }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70"
            >
              {record.transitions.paymentStatus.map((status) => (
                <option key={status} value={status}>
                  {paymentStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-small font-medium text-foreground">
            <span>{copy.shippingStatus}</span>
            <select
              id={shippingStatusSelectId}
              value={operationsDraft.shippingStatus}
              data-admin-order-shipping-status-select
              disabled={isSubmitting}
              onChange={(event) =>
                onOperationsDraftChange((current) => ({
                  ...current,
                  shippingStatus: event.target.value as ShippingStatus,
                }))
              }
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70"
            >
              {record.transitions.shippingStatus.map((status) => (
                <option key={status} value={status}>
                  {shippingStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label
            htmlFor={internalNotesId}
            className="grid gap-1 text-small font-medium text-foreground"
          >
            <span>{copy.internalNotes}</span>
            <textarea
              id={internalNotesId}
              value={operationsDraft.internalNotes}
              maxLength={2000}
              rows={4}
              data-admin-order-internal-notes
              disabled={isSubmitting}
              onChange={(event) =>
                onOperationsDraftChange((current) => ({
                  ...current,
                  internalNotes: event.target.value,
                }))
              }
              className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-body text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70"
            />
          </label>

          <Button
            type="submit"
            className="sm:min-w-32"
            disabled={!hasOperationsChange || isSubmitting}
            isLoading={isSubmitting}
            data-admin-order-status-submit
          >
            {copy.update}
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
        <DetailRow label={copy.customer}>{record.order.customerName}</DetailRow>
        <DetailRow label={copy.email}>{record.order.customerEmail}</DetailRow>
        <DetailRow label={copy.phone}>{record.order.customerPhone}</DetailRow>
        <DetailRow label={copy.shipping}>{record.order.shippingAddress}</DetailRow>
        <DetailRow label={copy.paymentStatus}>
          <span data-admin-order-payment-status={record.operations.paymentStatus}>
            {paymentStatusLabels[record.operations.paymentStatus]}
          </span>
        </DetailRow>
        <DetailRow label={copy.shippingStatus}>
          <span data-admin-order-shipping-status={record.operations.shippingStatus}>
            {shippingStatusLabels[record.operations.shippingStatus]}
          </span>
        </DetailRow>
        <DetailRow label={copy.updated}>
          {formatOrderDate(record.order.updatedAt, language)}
        </DetailRow>
        <DetailRow label={copy.total}>{formatVnd(record.order.subtotal)}</DetailRow>
      </dl>

      <div className="mt-case-lg">
        <h3 className="text-small font-semibold uppercase tracking-normal text-text-muted">
          {copy.items}
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

function OrderStatusBadge({
  language,
  status,
}: {
  language: Language;
  status: OrderStatus;
}) {
  return (
    <Badge
      variant={statusBadgeVariants[status]}
      data-admin-order-status={status}
    >
      {statusLabelsByLanguage[language][status]}
    </Badge>
  );
}

function OrderOperationsStatusStack({
  copy,
  language,
  record,
}: {
  copy: (typeof adminOrdersCopy)[Language];
  language: Language;
  record: AdminOrderRecord;
}) {
  return (
    <div className="grid gap-1">
      <OrderStatusBadge language={language} status={record.order.status} />
      <span
        className="text-text-muted"
        data-admin-order-payment-status={record.operations.paymentStatus}
      >
        {copy.paymentStatus}:{" "}
        {paymentStatusLabelsByLanguage[language][record.operations.paymentStatus]}
      </span>
      <span
        className="text-text-muted"
        data-admin-order-shipping-status={record.operations.shippingStatus}
      >
        {copy.shippingStatus}:{" "}
        {shippingStatusLabelsByLanguage[language][record.operations.shippingStatus]}
      </span>
    </div>
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

function buildAdminOrdersUrl(filters: OrderFilters) {
  const params = new URLSearchParams();
  const query = filters.q.trim();

  if (query) {
    params.set("q", query);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.paymentStatus !== "all") {
    params.set("paymentStatus", filters.paymentStatus);
  }

  if (filters.shippingStatus !== "all") {
    params.set("shippingStatus", filters.shippingStatus);
  }

  const queryString = params.toString();

  return queryString ? `/api/admin/orders?${queryString}` : "/api/admin/orders";
}

function getOperationsDraft(
  record: AdminOrderRecord | null | undefined,
): OrderOperationsDraft {
  return {
    internalNotes: record?.operations.internalNotes ?? "",
    orderStatus: record?.order.status ?? "pending",
    paymentStatus: record?.operations.paymentStatus ?? "pending",
    shippingStatus: record?.operations.shippingStatus ?? "pending",
  };
}

function hasOperationsChanges(
  draft: OrderOperationsDraft,
  record: AdminOrderRecord,
) {
  return (
    draft.orderStatus !== record.order.status ||
    draft.paymentStatus !== record.operations.paymentStatus ||
    draft.shippingStatus !== record.operations.shippingStatus ||
    draft.internalNotes.trim() !== record.operations.internalNotes
  );
}

function normalizeOperationsDraftForOrderStatus(
  current: OrderOperationsDraft,
  orderStatus: OrderStatus,
): OrderOperationsDraft {
  if (orderStatus !== "cancelled") {
    return {
      ...current,
      orderStatus,
    };
  }

  return {
    ...current,
    orderStatus,
    paymentStatus: isOpenPaymentStatus(current.paymentStatus)
      ? "cancelled"
      : current.paymentStatus,
    shippingStatus: isOpenShippingStatus(current.shippingStatus)
      ? "cancelled"
      : current.shippingStatus,
  };
}

function isOpenPaymentStatus(status: PaymentStatus) {
  return (
    status === "pending" ||
    status === "awaiting-transfer" ||
    status === "awaiting-provider-confirmation"
  );
}

function isOpenShippingStatus(status: ShippingStatus) {
  return status === "pending" || status === "preparing";
}

function AdminOrdersAuthRequired({
  copy,
  message,
}: {
  copy: (typeof adminOrdersCopy)[Language];
  message?: string;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-admin-orders-auth-required
    >
      <Badge variant="warning">{copy.authBadge}</Badge>
      <div className="mt-case-md max-w-xl">
        <h2 className="text-heading-2 font-semibold text-foreground">
          {copy.authTitle}
        </h2>
        <p className="mt-case-sm text-body leading-7 text-text-muted">
          {message ?? copy.authDefaultMessage}
        </p>
      </div>
      <Link
        href="/admin/login"
        className="mt-case-lg inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {copy.goToAdminLogin}
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

function AdminOrdersEmpty({
  copy,
}: {
  copy: (typeof adminOrdersCopy)[Language];
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-admin-orders-empty
    >
      <Badge variant="neutral">{copy.noOrders}</Badge>
      <div className="mt-case-md max-w-xl">
        <h2 className="text-heading-2 font-semibold text-foreground">
          {copy.noOrdersTitle}
        </h2>
        <p className="mt-case-sm text-body leading-7 text-text-muted">
          {copy.noOrdersDescription}
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

function formatOrderDate(value: string, language: Language) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return adminOrdersCopy[language].invalidDate;
  }

  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
