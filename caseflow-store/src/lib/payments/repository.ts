import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  demoPaymentStatusSchema,
  paymentProviderSchema,
  paymentReferenceSchema,
} from "@/lib/validation/payments";
import {
  idSchema,
  isoDateTimeStringSchema,
  moneyAmountSchema,
  orderCodeSchema,
  orderStatusSchema,
  paymentStatusSchema,
} from "@/lib/validation/domain";
import type { PaymentSession } from "@/lib/payments/types";
import type { Json, TableInsert, TableRow, TableUpdate } from "@/types/supabase";

const paymentRowSchema = z.object({
  amount: moneyAmountSchema,
  created_at: isoDateTimeStringSchema,
  currency: z.literal("VND"),
  expires_at: isoDateTimeStringSchema,
  id: z.string().trim().min(1),
  order_id: idSchema,
  paid_at: isoDateTimeStringSchema.nullable(),
  payment_reference: paymentReferenceSchema,
  provider: paymentProviderSchema,
  qr_payload: z.string().trim().min(10).max(4096),
  status: demoPaymentStatusSchema,
  updated_at: isoDateTimeStringSchema,
}) satisfies z.ZodType<TableRow<"payments">>;

const paymentOrderRowSchema = z.object({
  customer_id: idSchema.nullable(),
  id: idSchema,
  order_code: orderCodeSchema,
  payment_status: paymentStatusSchema,
  status: orderStatusSchema,
  total_vnd: moneyAmountSchema,
}) satisfies z.ZodType<
  Pick<
    TableRow<"orders">,
    "customer_id" | "id" | "order_code" | "payment_status" | "status" | "total_vnd"
  >
>;

export type PaymentRow = z.infer<typeof paymentRowSchema>;
export type PaymentOrderRow = z.infer<typeof paymentOrderRowSchema>;

export type PaymentRecord = {
  order: PaymentOrderRow;
  payment: PaymentRow;
};

export async function getOrderForCustomerPayment(input: {
  customerId: string;
  orderIdentifier: string;
}): Promise<PaymentOrderRow | null> {
  const supabase = createSupabaseAdminClient();
  const query = supabase
    .from("orders")
    .select("id,order_code,customer_id,status,payment_status,total_vnd")
    .eq("customer_id", input.customerId);
  const filterColumn = isUuid(input.orderIdentifier) ? "id" : "order_code";
  const { data, error } = await query
    .eq(filterColumn, input.orderIdentifier)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read order for payment", { cause: error });
  }

  return data ? paymentOrderRowSchema.parse(data) : null;
}

export async function getLatestPaymentForOrder(
  orderId: string,
): Promise<PaymentRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read latest payment", { cause: error });
  }

  return data ? paymentRowSchema.parse(data) : null;
}

export async function insertPayment(
  payment: TableInsert<"payments">,
): Promise<PaymentRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select("*")
    .single();

  if (error) {
    throw new Error("Failed to insert payment", { cause: error });
  }

  return paymentRowSchema.parse(data);
}

export async function getPaymentForCustomer(input: {
  customerId: string;
  paymentId: string;
}): Promise<PaymentRecord | null> {
  const payment = await getPaymentById(input.paymentId);

  if (!payment) {
    return null;
  }

  const order = await getPaymentOrderById(payment.order_id);

  if (!order || order.customer_id !== input.customerId) {
    return null;
  }

  return { order, payment };
}

export async function getPaymentForWebhook(
  paymentId: string,
): Promise<PaymentRecord | null> {
  const payment = await getPaymentById(paymentId);

  if (!payment) {
    return null;
  }

  const order = await getPaymentOrderById(payment.order_id);

  return order ? { order, payment } : null;
}

export async function expirePayment(payment: PaymentRow): Promise<PaymentRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .update({
      status: "EXPIRED",
    } satisfies TableUpdate<"payments">)
    .eq("id", payment.id)
    .eq("status", "PENDING")
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("Failed to expire payment", { cause: error });
  }

  await supabase
    .from("orders")
    .update({
      payment_status: "expired",
    } satisfies TableUpdate<"orders">)
    .eq("id", payment.order_id)
    .not("payment_status", "in", "(confirmed,cancelled)");

  return data ? paymentRowSchema.parse(data) : payment;
}

export async function markPaymentPaid(input: {
  paidAt: string;
  paymentId: string;
}): Promise<Json> {
  const supabase = createSupabaseAdminClient();
  // RPC thuc hien cap nhat payment/order trong mot transaction de tranh lech
  // trang thai khi webhook hoac simulate request duoc gui lap.
  const { data, error } = await supabase.rpc("mark_demo_payment_paid", {
    p_paid_at: input.paidAt,
    p_payment_id: input.paymentId,
  });

  if (error) {
    throw new Error("Failed to mark payment paid", { cause: error });
  }

  return data;
}

async function getPaymentById(paymentId: string): Promise<PaymentRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read payment", { cause: error });
  }

  return data ? paymentRowSchema.parse(data) : null;
}

async function getPaymentOrderById(
  orderId: string,
): Promise<PaymentOrderRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_code,customer_id,status,payment_status,total_vnd")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to read payment order", { cause: error });
  }

  return data ? paymentOrderRowSchema.parse(data) : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function mapPaymentRecordToSession(input: {
  allowSimulation: boolean;
  config: {
    accountName: string;
    accountNumber: string;
    bankBin: string;
    bankName: string;
    merchantName: string;
  };
  order: PaymentOrderRow;
  payment: PaymentRow;
}): PaymentSession {
  return {
    allowSimulation: input.allowSimulation,
    amount: input.payment.amount,
    createdAt: input.payment.created_at,
    currency: input.payment.currency,
    expiresAt: input.payment.expires_at,
    merchant: {
      accountName: input.config.accountName,
      accountNumber: input.config.accountNumber,
      bankBin: input.config.bankBin,
      bankName: `${input.config.bankName} - DEMO`,
      name: input.config.merchantName,
    },
    order: {
      orderCode: input.order.order_code,
      paymentStatus: input.order.payment_status,
      status: input.order.status,
    },
    orderId: input.order.order_code,
    paidAt: input.payment.paid_at,
    paymentContent: input.order.order_code,
    paymentId: input.payment.id,
    paymentReference: input.payment.payment_reference,
    provider: input.payment.provider,
    qrPayload: input.payment.qr_payload,
    serverTime: new Date().toISOString(),
    status: input.payment.status,
  };
}
