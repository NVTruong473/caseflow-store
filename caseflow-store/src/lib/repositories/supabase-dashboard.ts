import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AdminDashboardQuery,
  DashboardRange,
} from "@/lib/validation/dashboard";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type InventoryStatus,
  type OrderStatus,
  type PaymentStatus,
  type ShippingStatus,
} from "@/types/domain";
import type { TableRow } from "@/types/supabase";

type DashboardOrderRow = Pick<
  TableRow<"orders">,
  | "created_at"
  | "customer_name"
  | "id"
  | "order_code"
  | "payment_status"
  | "shipping_status"
  | "status"
  | "total_vnd"
  | "updated_at"
>;

type DashboardOrderItemRow = Pick<
  TableRow<"order_items">,
  | "book_edition_id"
  | "edition_title"
  | "line_total"
  | "line_total_vnd"
  | "order_id"
  | "product_name"
  | "quantity"
>;

type DashboardEditionRow = Pick<
  TableRow<"book_editions">,
  | "display_title"
  | "id"
  | "inventory_status"
  | "is_active"
  | "low_stock_threshold"
  | "slug"
  | "stock_quantity"
>;

export type AdminDashboardStatusSummary<TStatus extends string> = {
  count: number;
  status: TStatus;
  totalVnd: number;
};

export type AdminDashboardLowStockEdition = {
  id: string;
  inventoryStatus: InventoryStatus;
  lowStockThreshold: number;
  slug: string;
  stockQuantity: number;
  title: string;
};

export type AdminDashboardTopBook = {
  editionId: string | null;
  quantitySold: number;
  revenueVnd: number;
  title: string;
};

export type AdminDashboardRecentOrder = {
  createdAt: string;
  customerName: string;
  orderCode: string;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  status: OrderStatus;
  totalVnd: number;
};

export type AdminDashboardData = {
  averageOrderValueVnd: number;
  generatedAt: string;
  inventorySummary: {
    activeEditions: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  lowStockEditions: AdminDashboardLowStockEdition[];
  orderCount: number;
  orderStatusSummary: AdminDashboardStatusSummary<OrderStatus>[];
  paymentSummary: AdminDashboardStatusSummary<PaymentStatus>[];
  range: {
    from: string | null;
    label: DashboardRange | "custom";
    to: string | null;
  };
  recentOrders: AdminDashboardRecentOrder[];
  revenueEstimateVnd: number;
  topBooks: AdminDashboardTopBook[];
};

export async function getSupabaseAdminDashboard(
  query: AdminDashboardQuery = {},
): Promise<AdminDashboardData> {
  const supabase = createSupabaseAdminClient();
  const window = resolveDashboardWindow(query);
  let ordersQuery = supabase
    .from("orders")
    .select(
      "id,order_code,customer_name,status,payment_status,shipping_status,total_vnd,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (window.from) {
    ordersQuery = ordersQuery.gte("created_at", window.from);
  }

  if (window.to) {
    ordersQuery = ordersQuery.lt("created_at", window.to);
  }

  const { data: ordersData, error: ordersError } = await ordersQuery;

  if (ordersError) {
    throw new Error("Failed to load dashboard orders", { cause: ordersError });
  }

  const orders = (ordersData ?? []) as DashboardOrderRow[];
  const orderIds = orders.map((order) => order.id);
  const [items, editions] = await Promise.all([
    listOrderItemsForDashboard(orderIds),
    listBookEditionsForDashboard(),
  ]);
  const revenueEligibleOrderIds = new Set(
    orders.filter(isRevenueEligibleOrder).map((order) => order.id),
  );
  const revenueEstimateVnd = orders
    .filter((order) => revenueEligibleOrderIds.has(order.id))
    .reduce((sum, order) => sum + order.total_vnd, 0);
  const lowStockEditions = editions
    .filter(
      (edition) =>
        edition.is_active &&
        (edition.inventory_status === "low-stock" ||
          edition.inventory_status === "out-of-stock" ||
          edition.stock_quantity <= edition.low_stock_threshold),
    )
    .toSorted(
      (first, second) =>
        first.stock_quantity - second.stock_quantity ||
        first.display_title.localeCompare(second.display_title),
    )
    .slice(0, 8)
    .map((edition) => ({
      id: edition.id,
      inventoryStatus: edition.inventory_status,
      lowStockThreshold: edition.low_stock_threshold,
      slug: edition.slug,
      stockQuantity: edition.stock_quantity,
      title: edition.display_title,
    }));

  return {
    averageOrderValueVnd:
      orders.length > 0 ? Math.round(revenueEstimateVnd / orders.length) : 0,
    generatedAt: new Date().toISOString(),
    inventorySummary: {
      activeEditions: editions.filter((edition) => edition.is_active).length,
      lowStockCount: editions.filter(
        (edition) =>
          edition.is_active &&
          (edition.inventory_status === "low-stock" ||
            edition.stock_quantity <= edition.low_stock_threshold),
      ).length,
      outOfStockCount: editions.filter(
        (edition) =>
          edition.is_active && edition.inventory_status === "out-of-stock",
      ).length,
    },
    lowStockEditions,
    orderCount: orders.length,
    orderStatusSummary: summarizeStatuses(orders, ORDER_STATUSES, "status"),
    paymentSummary: summarizeStatuses(
      orders,
      PAYMENT_STATUSES,
      "payment_status",
    ),
    range: {
      from: window.from,
      label: window.label,
      to: window.to,
    },
    recentOrders: orders.slice(0, 8).map((order) => ({
      createdAt: order.created_at,
      customerName: order.customer_name,
      orderCode: order.order_code,
      paymentStatus: order.payment_status as PaymentStatus,
      shippingStatus: order.shipping_status as ShippingStatus,
      status: order.status,
      totalVnd: order.total_vnd,
    })),
    revenueEstimateVnd,
    topBooks: summarizeTopBooks(items, revenueEligibleOrderIds),
  };
}

async function listOrderItemsForDashboard(orderIds: string[]) {
  if (orderIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "order_id,book_edition_id,edition_title,product_name,quantity,line_total,line_total_vnd",
    )
    .in("order_id", orderIds);

  if (error) {
    throw new Error("Failed to load dashboard order items", { cause: error });
  }

  return (data ?? []) as DashboardOrderItemRow[];
}

async function listBookEditionsForDashboard() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("book_editions")
    .select(
      "id,slug,display_title,stock_quantity,low_stock_threshold,inventory_status,is_active",
    );

  if (error) {
    throw new Error("Failed to load dashboard book editions", { cause: error });
  }

  return (data ?? []) as DashboardEditionRow[];
}

function summarizeStatuses<
  TStatus extends OrderStatus | PaymentStatus,
  TField extends "payment_status" | "status",
>(
  orders: DashboardOrderRow[],
  statuses: readonly TStatus[],
  field: TField,
): AdminDashboardStatusSummary<TStatus>[] {
  const summary = new Map<TStatus, AdminDashboardStatusSummary<TStatus>>(
    statuses.map((status) => [status, { count: 0, status, totalVnd: 0 }]),
  );

  for (const order of orders) {
    const status = order[field] as TStatus;
    const current = summary.get(status);

    if (!current) {
      continue;
    }

    current.count += 1;
    current.totalVnd += order.total_vnd;
  }

  return statuses.map((status) => summary.get(status)!).filter(Boolean);
}

function summarizeTopBooks(
  items: DashboardOrderItemRow[],
  revenueEligibleOrderIds: Set<string>,
) {
  const topBooks = new Map<string, AdminDashboardTopBook>();

  for (const item of items) {
    if (!revenueEligibleOrderIds.has(item.order_id)) {
      continue;
    }

    const key = item.book_edition_id ?? item.product_name;
    const current = topBooks.get(key) ?? {
      editionId: item.book_edition_id,
      quantitySold: 0,
      revenueVnd: 0,
      title: item.edition_title ?? item.product_name,
    };

    current.quantitySold += item.quantity;
    current.revenueVnd += item.line_total_vnd ?? item.line_total;
    topBooks.set(key, current);
  }

  return [...topBooks.values()]
    .toSorted(
      (first, second) =>
        second.revenueVnd - first.revenueVnd ||
        second.quantitySold - first.quantitySold ||
        first.title.localeCompare(second.title),
    )
    .slice(0, 8);
}

function isRevenueEligibleOrder(order: DashboardOrderRow) {
  return (
    order.status !== "cancelled" &&
    order.payment_status !== "failed" &&
    order.payment_status !== "cancelled"
  );
}

export function resolveDashboardWindow(query: AdminDashboardQuery) {
  if (query.from && query.to) {
    return {
      from: `${query.from}T00:00:00.000Z`,
      label: "custom" as const,
      to: addDays(`${query.to}T00:00:00.000Z`, 1),
    };
  }

  const range = query.range ?? "30d";

  if (range === "all") {
    return {
      from: null,
      label: range,
      to: null,
    };
  }

  const now = new Date();
  const days = range === "7d" ? 7 : 30;
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - days);

  return {
    from: from.toISOString(),
    label: range,
    to: null,
  };
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString();
}
