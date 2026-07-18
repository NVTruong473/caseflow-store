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

type OrderItemExportRow = Pick<
  TableRow<"order_items">,
  | "book_edition_id"
  | "edition_format"
  | "edition_language"
  | "edition_title"
  | "order_id"
  | "product_name"
  | "quantity"
>;

type OrderItemExportSummary = {
  count: number;
  formats: Set<string>;
  languages: Set<string>;
  summaries: string[];
};

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
  const itemSummaries = await loadOrderItemExportSummaries(
    orders.map((order) => order.id),
  );
  const rows = orders.map((order) => {
    const summary = getOrderItemSummary(order.id, itemSummaries);

    return [
      order.order_code,
      order.created_at,
      order.updated_at,
      order.status,
      order.payment_method,
      order.payment_status,
      order.shipping_method,
      order.shipping_status,
      summary.count.toString(),
      joinSetValues(summary.languages),
      joinSetValues(summary.formats),
      summary.summaries.join(" | "),
      order.subtotal.toString(),
      order.discount_total_vnd.toString(),
      order.shipping_fee_vnd.toString(),
      order.tax_total_vnd.toString(),
      order.payment_fee_vnd.toString(),
      order.total_vnd.toString(),
      order.promotion_code ?? "",
    ];
  });

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
      "item_languages",
      "item_formats",
      "item_summary",
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

async function loadOrderItemExportSummaries(orderIds: string[]) {
  const itemSummaries = new Map<string, OrderItemExportSummary>();

  if (orderIds.length === 0) {
    return itemSummaries;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "order_id,book_edition_id,edition_title,edition_language,edition_format,product_name,quantity",
    )
    .in("order_id", orderIds);

  if (error) {
    throw new Error("Failed to load order item counts for CSV export", {
      cause: error,
    });
  }

  for (const item of (data ?? []) as OrderItemExportRow[]) {
    const summary = getOrderItemSummary(item.order_id, itemSummaries);
    const title = item.edition_title ?? item.product_name;
    const metadata = [
      item.edition_language,
      item.edition_format,
      item.book_edition_id ? `edition:${item.book_edition_id}` : null,
    ].filter((value): value is string => Boolean(value));

    summary.count += item.quantity;

    if (item.edition_language) {
      summary.languages.add(item.edition_language);
    }

    if (item.edition_format) {
      summary.formats.add(item.edition_format);
    }

    summary.summaries.push(
      metadata.length > 0
        ? `${item.quantity}x ${title} (${metadata.join("; ")})`
        : `${item.quantity}x ${title}`,
    );
    itemSummaries.set(item.order_id, summary);
  }

  return itemSummaries;
}

function getOrderItemSummary(
  orderId: string,
  itemSummaries: Map<string, OrderItemExportSummary>,
) {
  return (
    itemSummaries.get(orderId) ?? {
      count: 0,
      formats: new Set<string>(),
      languages: new Set<string>(),
      summaries: [],
    }
  );
}

function joinSetValues(values: Set<string>) {
  return [...values].sort().join("|");
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
