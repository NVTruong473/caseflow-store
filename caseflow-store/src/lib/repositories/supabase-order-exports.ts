import { resolveDashboardWindow } from "@/lib/repositories/supabase-dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminDashboardQuery } from "@/lib/validation/dashboard";
import type { TableRow } from "@/types/supabase";

type OrderExportRow = Pick<
  TableRow<"orders">,
  | "created_at"
  | "discount_total_vnd"
  | "id"
  | "order_code"
  | "payment_fee_vnd"
  | "payment_method"
  | "payment_status"
  | "promotion_code"
  | "shipping_fee_vnd"
  | "shipping_method"
  | "shipping_status"
  | "status"
  | "subtotal"
  | "tax_total_vnd"
  | "total_vnd"
  | "updated_at"
>;

type OrderItemCountRow = Pick<TableRow<"order_items">, "order_id" | "quantity">;

export async function createSupabaseOrdersCsvExport(
  query: AdminDashboardQuery = {},
) {
  const supabase = createSupabaseAdminClient();
  const window = resolveDashboardWindow(query);
  let ordersQuery = supabase
    .from("orders")
    .select(
      "id,order_code,created_at,updated_at,status,payment_method,payment_status,shipping_method,shipping_status,subtotal,discount_total_vnd,shipping_fee_vnd,tax_total_vnd,payment_fee_vnd,total_vnd,promotion_code",
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
    throw new Error("Failed to load orders for CSV export", {
      cause: ordersError,
    });
  }

  const orders = (ordersData ?? []) as OrderExportRow[];
  const itemCounts = await loadOrderItemCounts(orders.map((order) => order.id));
  const rows = orders.map((order) => [
    order.order_code,
    order.created_at,
    order.updated_at,
    order.status,
    order.payment_method,
    order.payment_status,
    order.shipping_method,
    order.shipping_status,
    itemCounts.get(order.id)?.toString() ?? "0",
    order.subtotal.toString(),
    order.discount_total_vnd.toString(),
    order.shipping_fee_vnd.toString(),
    order.tax_total_vnd.toString(),
    order.payment_fee_vnd.toString(),
    order.total_vnd.toString(),
    order.promotion_code ?? "",
  ]);

  return toCsv([
    [
      "order_code",
      "created_at",
      "updated_at",
      "order_status",
      "payment_method",
      "payment_status",
      "shipping_method",
      "shipping_status",
      "item_count",
      "subtotal_vnd",
      "discount_total_vnd",
      "shipping_fee_vnd",
      "tax_total_vnd",
      "payment_fee_vnd",
      "total_vnd",
      "promotion_code",
    ],
    ...rows,
  ]);
}

async function loadOrderItemCounts(orderIds: string[]) {
  const itemCounts = new Map<string, number>();

  if (orderIds.length === 0) {
    return itemCounts;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("order_id,quantity")
    .in("order_id", orderIds);

  if (error) {
    throw new Error("Failed to load order item counts for CSV export", {
      cause: error,
    });
  }

  for (const item of (data ?? []) as OrderItemCountRow[]) {
    itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + item.quantity);
  }

  return itemCounts;
}

function toCsv(rows: string[][]) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function csvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}
