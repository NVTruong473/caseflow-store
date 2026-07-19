import { z } from "zod";

import {
  getOrderOperationsTransitions,
  isAllowedOrderStatusTransition,
  isAllowedPaymentStatusTransition,
  isAllowedShippingStatusTransition,
  type OrderOperationsTransitions,
} from "@/lib/orders/status-transitions";
import {
  mapOrderItemRowToDomain,
  mapOrderRowToDomain,
} from "@/lib/supabase/mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  bookOrderTotalsSchema,
  bookShippingAddressSchema,
  customerEmailSchema,
  customerNameSchema,
  customerPhoneSchema,
  currencyCodeSchema,
  idSchema,
  isoDateTimeStringSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  orderCodeSchema,
  orderStatusSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  quantitySchema,
  shippingAddressSchema,
  shippingMethodSchema,
  shippingStatusSchema,
} from "@/lib/validation/domain";
import type { Order, OrderItem } from "@/types/domain";
import type {
  AdminOrderFilters,
  UpdateAdminOrderOperationsRequest,
  UpdateOrderStatusRequest,
} from "@/lib/validation/orders";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
  ShippingStatus,
} from "@/types/domain";
import type { Json, TableRow, TableUpdate } from "@/types/supabase";

const jsonSchema = z.custom<Json>();

const orderRowSchema = z.object({
  id: idSchema,
  order_code: orderCodeSchema,
  customer_name: customerNameSchema,
  customer_email: customerEmailSchema,
  customer_phone: customerPhoneSchema,
  shipping_address: shippingAddressSchema,
  status: orderStatusSchema,
  subtotal: moneyAmountSchema,
  customer_id: idSchema.nullable(),
  shipping_address_json: jsonSchema.nullable(),
  payment_method: paymentMethodSchema,
  payment_status: paymentStatusSchema,
  shipping_method: shippingMethodSchema,
  shipping_status: shippingStatusSchema,
  internal_notes: z.string().max(2000),
  currency: currencyCodeSchema,
  discount_total_vnd: moneyAmountSchema,
  shipping_fee_vnd: moneyAmountSchema,
  tax_total_vnd: moneyAmountSchema,
  payment_fee_vnd: moneyAmountSchema,
  tax_estimates: jsonSchema,
  fee_estimates: jsonSchema,
  display_estimate: jsonSchema.nullable(),
  promotion_code: orderCodeSchema.nullable(),
  total_vnd: moneyAmountSchema,
  created_at: isoDateTimeStringSchema,
  updated_at: isoDateTimeStringSchema,
}) satisfies z.ZodType<TableRow<"orders">>;

const orderItemRowSchema = z.object({
  id: idSchema,
  order_id: idSchema,
  product_id: idSchema.nullable(),
  product_name: nonEmptyStringSchema.max(180),
  unit_price: moneyAmountSchema,
  quantity: quantitySchema,
  line_total: moneyAmountSchema,
  book_edition_id: idSchema.nullable(),
  book_work_id: idSchema.nullable(),
  edition_title: z.string().trim().min(1).max(180).nullable(),
  edition_language: z.enum(["vi", "en"]).nullable(),
  edition_format: z
    .enum(["paperback", "hardcover", "box-set", "special-edition"])
    .nullable(),
  unit_price_vnd: moneyAmountSchema.nullable(),
  line_total_vnd: moneyAmountSchema.nullable(),
}) satisfies z.ZodType<TableRow<"order_items">>;

const createOrderLineSchema = z
  .object({
    productId: idSchema,
    productName: nonEmptyStringSchema.max(120),
    unitPrice: moneyAmountSchema,
    quantity: quantitySchema,
    lineTotal: moneyAmountSchema,
  })
  .superRefine((line, context) => {
    if (line.lineTotal !== line.unitPrice * line.quantity) {
      context.addIssue({
        code: "custom",
        path: ["lineTotal"],
        message: "lineTotal must equal unitPrice multiplied by quantity",
      });
    }
  });

const createSupabaseOrderInputSchema = z
  .object({
    customerName: customerNameSchema,
    customerEmail: customerEmailSchema,
    customerPhone: customerPhoneSchema,
    shippingAddress: shippingAddressSchema,
    subtotal: moneyAmountSchema,
    items: z.array(createOrderLineSchema).min(1).max(25),
  })
  .superRefine((input, context) => {
    const productIds = input.items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Order items must have unique product IDs",
      });
    }

    const calculatedSubtotal = input.items.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    if (calculatedSubtotal !== input.subtotal) {
      context.addIssue({
        code: "custom",
        path: ["subtotal"],
        message: "subtotal must equal the sum of line totals",
      });
    }
  });

const createBookOrderLineSchema = z.object({
  editionId: idSchema,
  quantity: quantitySchema,
});

const createSupabaseBookOrderInputSchema = z
  .object({
    customerId: idSchema,
    customerName: customerNameSchema,
    customerEmail: customerEmailSchema,
    customerPhone: customerPhoneSchema,
    shippingAddress: bookShippingAddressSchema,
    shippingMethod: shippingMethodSchema,
    paymentMethod: paymentMethodSchema,
    promotionCode: orderCodeSchema.nullable().optional(),
    totals: bookOrderTotalsSchema,
    items: z.array(createBookOrderLineSchema).min(1).max(50),
  })
  .superRefine((input, context) => {
    const editionIds = input.items.map((item) => item.editionId);

    if (new Set(editionIds).size !== editionIds.length) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Order items must have unique book edition IDs",
      });
    }
  });

const createOrderRpcResultSchema = z.object({
  order: orderRowSchema,
  items: z.array(orderItemRowSchema).min(1).max(25),
});

export type CreateSupabaseOrderInput = z.infer<
  typeof createSupabaseOrderInputSchema
>;
export type CreateSupabaseBookOrderInput = z.infer<
  typeof createSupabaseBookOrderInputSchema
>;

export type SupabaseOrderRecord = {
  order: Order;
  items: OrderItem[];
};

export type AdminOrderOperations = {
  paymentStatus: PaymentStatus;
  shippingMethod: ShippingMethod;
  shippingStatus: ShippingStatus;
  internalNotes: string;
};

export type SupabaseAdminOrderRecord = SupabaseOrderRecord & {
  operations: AdminOrderOperations;
  transitions: OrderOperationsTransitions;
};

export type UpdateAdminOrderOperationsResult =
  | { success: true; record: SupabaseAdminOrderRecord }
  | {
      success: false;
      code: "ORDER_NOT_FOUND" | "ORDER_INVALID_TRANSITION";
      message: string;
      status: 404 | 409;
    };

export type CancelCustomerOrderResult =
  | { success: true; record: SupabaseOrderRecord }
  | {
      success: false;
      code: "ORDER_NOT_FOUND" | "ORDER_CANCEL_NOT_ALLOWED";
      message: string;
      status: 404 | 409;
    };

export type PublicOrderTrackingRecord = {
  orderCode: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  shippingMethod: ShippingMethod | null;
  totalVnd: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function listSupabaseAdminOrders(
  filters: AdminOrderFilters = {},
): Promise<SupabaseAdminOrderRecord[]> {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("orders")
    .select("*,order_items(*)")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.paymentStatus) {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  if (filters.shippingStatus) {
    query = query.eq("shipping_status", filters.shippingStatus);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to list admin orders", { cause: error });
  }

  const records = data.map(({ order_items: orderItems, ...order }) =>
    mapSupabaseAdminOrderRecord(order, orderItems),
  );

  if (!filters.q) {
    return records;
  }

  const normalizedQuery = filters.q.toLowerCase();

  return records.filter((record) =>
    [
      record.order.orderCode,
      record.order.customerName,
      record.order.customerEmail,
      record.order.customerPhone,
      record.operations.internalNotes,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

export async function listSupabaseOrders(): Promise<SupabaseOrderRecord[]> {
  const adminRecords = await listSupabaseAdminOrders();

  return adminRecords.map(({ items, order }) => ({ items, order }));
}

export async function listSupabaseOrdersForCustomer(
  customerId: string,
): Promise<SupabaseOrderRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*,order_items(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to list customer orders", { cause: error });
  }

  return data.map(({ order_items: orderItems, ...order }) => ({
    order: mapOrderRowToDomain(order),
    items: orderItems
      .toSorted((first, second) => first.id.localeCompare(second.id))
      .map(mapOrderItemRowToDomain),
  }));
}

export async function getSupabaseOrderForCustomer(
  customerId: string,
  orderCode: string,
): Promise<SupabaseOrderRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*,order_items(*)")
    .eq("customer_id", customerId)
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read customer order", { cause: error });
  }

  if (!data) {
    return null;
  }

  const { order_items: orderItems, ...order } = data;

  return {
    order: mapOrderRowToDomain(order),
    items: orderItems
      .toSorted((first, second) => first.id.localeCompare(second.id))
      .map(mapOrderItemRowToDomain),
  };
}

export async function cancelSupabaseOrderForCustomer(
  customerId: string,
  orderCode: string,
): Promise<CancelCustomerOrderResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*,order_items(*)")
    .eq("customer_id", customerId)
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read customer order for cancellation", {
      cause: error,
    });
  }

  if (!data) {
    return {
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      status: 404,
      success: false,
    };
  }

  if (data.status === "cancelled") {
    const { order_items: orderItems, ...order } = data;

    return {
      record: {
        items: orderItems
          .toSorted((first, second) => first.id.localeCompare(second.id))
          .map(mapOrderItemRowToDomain),
        order: mapOrderRowToDomain(order),
      },
      success: true,
    };
  }

  if (!canCustomerCancelOrder(data)) {
    return {
      code: "ORDER_CANCEL_NOT_ALLOWED",
      message:
        "This order can no longer be cancelled from the customer account",
      status: 409,
      success: false,
    };
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({
      internal_notes: appendInternalNote(
        data.internal_notes,
        "Customer cancelled order from account order history.",
      ),
      payment_status: "cancelled",
      shipping_status: "cancelled",
      status: "cancelled",
    } satisfies TableUpdate<"orders">)
    .eq("id", data.id)
    .select("*,order_items(*)")
    .maybeSingle();

  if (updateError) {
    throw new Error("Failed to cancel customer order", { cause: updateError });
  }

  if (!updatedOrder) {
    return {
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      status: 404,
      success: false,
    };
  }

  const { order_items: orderItems, ...order } = updatedOrder;

  return {
    record: {
      items: orderItems
        .toSorted((first, second) => first.id.localeCompare(second.id))
        .map(mapOrderItemRowToDomain),
      order: mapOrderRowToDomain(order),
    },
    success: true,
  };
}

export async function getSupabaseOrderForPublicTracking(
  orderCode: string,
  contact: string,
): Promise<PublicOrderTrackingRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*,order_items(id,quantity)")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read public order tracking", { cause: error });
  }

  if (!data || !contactMatchesOrder(data, contact)) {
    return null;
  }

  const order = mapOrderRowToDomain(data);
  const itemCount = data.order_items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return {
    createdAt: order.createdAt,
    itemCount,
    orderCode: order.orderCode,
    paymentMethod: order.paymentMethod ?? null,
    paymentStatus: order.paymentStatus ?? null,
    shippingMethod: order.shippingMethod ?? null,
    status: order.status,
    totalVnd: order.subtotal,
    updatedAt: order.updatedAt,
  };
}

export async function updateSupabaseOrderStatus(
  orderId: string,
  request: UpdateOrderStatusRequest,
): Promise<SupabaseOrderRecord | null> {
  const result = await updateSupabaseAdminOrderOperations(orderId, {
    status: request.status,
  });

  if (!result.success) {
    return null;
  }

  return {
    items: result.record.items,
    order: result.record.order,
  };
}

export async function updateSupabaseAdminOrderOperations(
  orderId: string,
  request: UpdateAdminOrderOperationsRequest,
): Promise<UpdateAdminOrderOperationsResult> {
  const supabase = createSupabaseAdminClient();
  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("*,order_items(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (existingOrderError) {
    throw new Error("Failed to read order operations", {
      cause: existingOrderError,
    });
  }

  if (!existingOrder) {
    return {
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      status: 404,
      success: false,
    };
  }

  const existingOperations = mapOrderRowToAdminOperations(existingOrder);
  const nextOrderStatus = request.status ?? existingOrder.status;
  const requestedPaymentStatus =
    request.paymentStatus ?? existingOperations.paymentStatus;
  const requestedShippingStatus =
    request.shippingStatus ?? existingOperations.shippingStatus;
  const nextPaymentStatus = normalizePaymentStatusForOrderStatus({
    current: existingOperations.paymentStatus,
    nextOrderStatus,
    requested: requestedPaymentStatus,
  });
  const nextShippingStatus = normalizeShippingStatusForOrderStatus({
    current: existingOperations.shippingStatus,
    nextOrderStatus,
    requested: requestedShippingStatus,
  });

  if (
    request.status !== undefined &&
    !isAllowedOrderStatusTransition(existingOrder.status, nextOrderStatus)
  ) {
    return invalidTransitionResult("Order status transition is not allowed");
  }

  if (
    nextPaymentStatus !== existingOperations.paymentStatus &&
    !isAllowedPaymentStatusTransition(
      existingOperations.paymentStatus,
      nextPaymentStatus,
    )
  ) {
    return invalidTransitionResult("Payment status transition is not allowed");
  }

  if (
    nextShippingStatus !== existingOperations.shippingStatus &&
    !isAllowedShippingStatusTransition(
      existingOperations.shippingStatus,
      nextShippingStatus,
    )
  ) {
    return invalidTransitionResult("Shipping status transition is not allowed");
  }

  const sanitizedUpdatePayload: TableUpdate<"orders"> = {};

  if (request.internalNotes !== undefined) {
    sanitizedUpdatePayload.internal_notes = request.internalNotes;
  }

  if (nextPaymentStatus !== existingOperations.paymentStatus) {
    sanitizedUpdatePayload.payment_status = nextPaymentStatus;
  }

  if (nextShippingStatus !== existingOperations.shippingStatus) {
    sanitizedUpdatePayload.shipping_status = nextShippingStatus;
  }

  if (request.status !== undefined) {
    sanitizedUpdatePayload.status = request.status;
  }

  if (Object.keys(sanitizedUpdatePayload).length === 0) {
    const { order_items: orderItems, ...order } = existingOrder;

    return {
      record: mapSupabaseAdminOrderRecord(order, orderItems),
      success: true,
    };
  }

  const { data: updatedOrder, error: updatedOrderError } = await supabase
    .from("orders")
    .update(sanitizedUpdatePayload)
    .eq("id", orderId)
    .select("*,order_items(*)")
    .maybeSingle();

  if (updatedOrderError) {
    throw new Error("Failed to update order operations", {
      cause: updatedOrderError,
    });
  }

  if (!updatedOrder) {
    return {
      code: "ORDER_NOT_FOUND",
      message: "Order not found",
      status: 404,
      success: false,
    };
  }

  const { order_items: orderItems, ...order } = updatedOrder;

  return {
    record: mapSupabaseAdminOrderRecord(order, orderItems),
    success: true,
  };
}

export async function createSupabaseOrder(
  rawInput: CreateSupabaseOrderInput,
): Promise<SupabaseOrderRecord> {
  const input = createSupabaseOrderInputSchema.parse(rawInput);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_order_with_items", {
    p_order_code: createOrderCode(),
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_shipping_address: input.shippingAddress,
    p_subtotal: input.subtotal,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    })),
  });

  if (error) {
    throw new Error("Failed to create order transaction", { cause: error });
  }

  const result = createOrderRpcResultSchema.parse(data);

  return {
    order: mapOrderRowToDomain(result.order),
    items: result.items.map(mapOrderItemRowToDomain),
  };
}

export async function createSupabaseBookOrder(
  rawInput: CreateSupabaseBookOrderInput,
): Promise<SupabaseOrderRecord> {
  const input = createSupabaseBookOrderInputSchema.parse(rawInput);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_book_order_with_items", {
    p_order_code: createOrderCode(),
    p_customer_id: input.customerId,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_shipping_address: input.shippingAddress as unknown as Json,
    p_shipping_method: input.shippingMethod,
    p_payment_method: input.paymentMethod,
    p_discount_total_vnd: input.totals.discountTotalVnd,
    p_shipping_fee_vnd: input.totals.shippingFeeVnd,
    p_tax_total_vnd: input.totals.taxTotalVnd,
    p_payment_fee_vnd: input.totals.paymentFeeVnd,
    p_tax_estimates: input.totals.taxEstimates as unknown as Json,
    p_fee_estimates: input.totals.feeEstimates as unknown as Json,
    p_display_estimate: input.totals.displayEstimate as unknown as Json | null,
    p_promotion_code: input.promotionCode ?? null,
    p_items: input.items.map((item) => ({
      edition_id: item.editionId,
      quantity: item.quantity,
    })) as unknown as Json,
  });

  if (error) {
    throw new Error("Failed to create book order transaction", {
      cause: error,
    });
  }

  const result = createOrderRpcResultSchema.parse(data);

  return {
    order: mapOrderRowToDomain(result.order),
    items: result.items.map(mapOrderItemRowToDomain),
  };
}

function createOrderCode() {
  const timeSegment = Date.now().toString(36).toUpperCase();
  const randomSegment = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 10)
    .toUpperCase();

  return `CF-${timeSegment}-${randomSegment}`;
}

function mapSupabaseAdminOrderRecord(
  order: TableRow<"orders">,
  orderItems: TableRow<"order_items">[],
): SupabaseAdminOrderRecord {
  const operations = mapOrderRowToAdminOperations(order);

  return {
    items: orderItems
      .toSorted((first, second) => first.id.localeCompare(second.id))
      .map(mapOrderItemRowToDomain),
    operations,
    order: mapOrderRowToDomain(order),
    transitions: getOrderOperationsTransitions({
      orderStatus: order.status,
      paymentStatus: operations.paymentStatus,
      shippingStatus: operations.shippingStatus,
    }),
  };
}

function mapOrderRowToAdminOperations(
  row: TableRow<"orders">,
): AdminOrderOperations {
  const parsedRow = orderRowSchema.parse(row);

  return {
    internalNotes: parsedRow.internal_notes,
    paymentStatus: parsedRow.payment_status,
    shippingMethod: parsedRow.shipping_method,
    shippingStatus: parsedRow.shipping_status,
  };
}

function invalidTransitionResult(
  message: string,
): UpdateAdminOrderOperationsResult {
  return {
    code: "ORDER_INVALID_TRANSITION",
    message,
    status: 409,
    success: false,
  };
}

function canCustomerCancelOrder(row: TableRow<"orders">) {
  const orderCanCancel = row.status === "pending" || row.status === "confirmed";
  const paymentCanCancel =
    row.payment_status === "pending" ||
    row.payment_status === "awaiting-transfer" ||
    row.payment_status === "awaiting-provider-confirmation";
  const shippingCanCancel =
    row.shipping_status === "pending" || row.shipping_status === "preparing";

  return orderCanCancel && paymentCanCancel && shippingCanCancel;
}

function normalizePaymentStatusForOrderStatus({
  current,
  nextOrderStatus,
  requested,
}: {
  current: PaymentStatus;
  nextOrderStatus: OrderStatus;
  requested: PaymentStatus;
}) {
  // Khi admin/staff từ chối hoặc hủy đơn, server tự đóng các payment còn
  // đang chờ để dashboard không tiếp tục ghi nhận là khoản phải thu.
  if (nextOrderStatus === "cancelled" && isOpenPaymentStatus(current)) {
    return "cancelled";
  }

  return requested;
}

function normalizeShippingStatusForOrderStatus({
  current,
  nextOrderStatus,
  requested,
}: {
  current: ShippingStatus;
  nextOrderStatus: OrderStatus;
  requested: ShippingStatus;
}) {
  // Đơn bị hủy trước khi giao vận rời kho thì trạng thái giao hàng cũng phải
  // đóng lại; đơn đã giao/hoàn không bị rewrite ngầm.
  if (nextOrderStatus === "cancelled" && isOpenShippingStatus(current)) {
    return "cancelled";
  }

  return requested;
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

function appendInternalNote(current: string, note: string) {
  const line = `[${new Date().toISOString()}] ${note}`;
  const next = [current.trim(), line].filter(Boolean).join("\n");

  if (next.length <= 2000) {
    return next;
  }

  return next.slice(next.length - 2000);
}

function contactMatchesOrder(row: TableRow<"orders">, contact: string) {
  return (
    normalizeEmail(row.customer_email) === normalizeEmail(contact) ||
    normalizePhone(row.customer_phone) === normalizePhone(contact)
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("0084")) {
    return `0${digits.slice(4)}`;
  }

  if (digits.startsWith("84") && digits.length >= 10) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}
