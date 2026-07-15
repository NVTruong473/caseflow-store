import { z } from "zod";

import {
  mapOrderItemRowToDomain,
  mapOrderRowToDomain,
} from "@/lib/supabase/mappers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  customerEmailSchema,
  customerNameSchema,
  customerPhoneSchema,
  idSchema,
  isoDateTimeStringSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  orderCodeSchema,
  orderStatusSchema,
  quantitySchema,
  shippingAddressSchema,
} from "@/lib/validation/domain";
import type { Order, OrderItem } from "@/types/domain";
import type { UpdateOrderStatusRequest } from "@/lib/validation/orders";
import type { TableRow } from "@/types/supabase";

const orderRowSchema = z.object({
  id: idSchema,
  order_code: orderCodeSchema,
  customer_name: customerNameSchema,
  customer_email: customerEmailSchema,
  customer_phone: customerPhoneSchema,
  shipping_address: shippingAddressSchema,
  status: orderStatusSchema,
  subtotal: moneyAmountSchema,
  created_at: isoDateTimeStringSchema,
  updated_at: isoDateTimeStringSchema,
}) satisfies z.ZodType<TableRow<"orders">>;

const orderItemRowSchema = z.object({
  id: idSchema,
  order_id: idSchema,
  product_id: idSchema,
  product_name: nonEmptyStringSchema.max(120),
  unit_price: moneyAmountSchema,
  quantity: quantitySchema,
  line_total: moneyAmountSchema,
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

const createOrderRpcResultSchema = z.object({
  order: orderRowSchema,
  items: z.array(orderItemRowSchema).min(1).max(25),
});

export type CreateSupabaseOrderInput = z.infer<
  typeof createSupabaseOrderInputSchema
>;

export type SupabaseOrderRecord = {
  order: Order;
  items: OrderItem[];
};

export async function listSupabaseOrders(): Promise<SupabaseOrderRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*,order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to list orders", { cause: error });
  }

  return data.map(({ order_items: orderItems, ...order }) => ({
    order: mapOrderRowToDomain(order),
    items: orderItems.map(mapOrderItemRowToDomain),
  }));
}

export async function updateSupabaseOrderStatus(
  orderId: string,
  request: UpdateOrderStatusRequest,
): Promise<SupabaseOrderRecord | null> {
  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .update({ status: request.status })
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (orderError) {
    throw new Error("Failed to update order status", { cause: orderError });
  }

  if (!order) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  if (itemsError) {
    throw new Error("Failed to read updated order items", { cause: itemsError });
  }

  return {
    order: mapOrderRowToDomain(order),
    items: items.map(mapOrderItemRowToDomain),
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

function createOrderCode() {
  const timeSegment = Date.now().toString(36).toUpperCase();
  const randomSegment = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 10)
    .toUpperCase();

  return `CF-${timeSegment}-${randomSegment}`;
}
