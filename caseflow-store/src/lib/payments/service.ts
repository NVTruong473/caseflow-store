import crypto from "node:crypto";

import { getDemoPaymentConfig, getMockPaymentWebhookSecret } from "@/lib/payments/config";
import {
  expirePayment,
  getLatestPaymentForOrder,
  getOrderForCustomerPayment,
  getPaymentForCustomer,
  getPaymentForWebhook,
  insertPayment,
  mapPaymentRecordToSession,
  markPaymentPaid,
  type PaymentOrderRow,
  type PaymentRecord,
  type PaymentRow,
} from "@/lib/payments/repository";
import type {
  PaymentServiceFailure,
  PaymentSession,
  PaymentServiceResult,
} from "@/lib/payments/types";
import { getPaymentProvider } from "@/lib/payments/providers";
import {
  createPaymentRequestSchema,
  mockPaymentWebhookPayloadSchema,
  type CreatePaymentRequest,
  type MockPaymentWebhookPayload,
} from "@/lib/validation/payments";

export async function createPaymentForCustomer(input: {
  customerId: string;
  request: CreatePaymentRequest;
}): Promise<PaymentServiceResult<PaymentSession>> {
  const parsedRequest = createPaymentRequestSchema.safeParse(input.request);

  if (!parsedRequest.success) {
    return failure("VALIDATION_ERROR", "Invalid payment request", 400);
  }

  const config = getDemoPaymentConfig();

  if (!config.allowQrDemoPayments) {
    return failure(
      "PAYMENT_DISABLED",
      "QR demo payments are not enabled in this environment",
      403,
    );
  }

  const order = await getOrderForCustomerPayment({
    customerId: input.customerId,
    orderIdentifier: parsedRequest.data.orderId,
  });

  if (!order) {
    return failure("ORDER_NOT_FOUND", "Order not found", 404);
  }

  const existingPayment = await getLatestPaymentForOrder(order.id);

  if (existingPayment) {
    const currentPayment = await refreshExpiredPayment(existingPayment);

    if (currentPayment.status === "PAID") {
      return {
        data: mapPaymentRecordToSession({
          allowSimulation: config.allowSimulation,
          config,
          order,
          payment: currentPayment,
        }),
        success: true,
      };
    }

    const orderGuard = validateOrderForPayment(order);

    if (!orderGuard.success) {
      return orderGuard;
    }

    if (currentPayment.status === "PENDING") {
      return {
        data: mapPaymentRecordToSession({
          allowSimulation: config.allowSimulation,
          config,
          order,
          payment: currentPayment,
        }),
        success: true,
      };
    }
  } else {
    const orderGuard = validateOrderForPayment(order);

    if (!orderGuard.success) {
      return orderGuard;
    }
  }

  const paymentId = createPaymentId();
  const paymentReference = createPaymentReference(order.order_code);
  const expiresAt = new Date(
    Date.now() + config.expiresMinutes * 60 * 1000,
  ).toISOString();
  const provider = getPaymentProvider(parsedRequest.data.provider);
  const qrPayload = provider.createQrPayload({
    amount: order.total_vnd,
    config,
    orderCode: order.order_code,
    paymentId,
    paymentReference,
  });
  const payment = await insertPayment({
    amount: order.total_vnd,
    currency: "VND",
    expires_at: expiresAt,
    id: paymentId,
    order_id: order.id,
    payment_reference: paymentReference,
    provider: provider.provider,
    qr_payload: qrPayload,
    status: "PENDING",
  });

  return {
    data: mapPaymentRecordToSession({
      allowSimulation: config.allowSimulation,
      config,
      order,
      payment,
    }),
    success: true,
  };
}

export async function getPaymentStatusForCustomer(input: {
  customerId: string;
  paymentId: string;
}): Promise<PaymentServiceResult<PaymentSession>> {
  const config = getDemoPaymentConfig();
  const record = await getPaymentForCustomer(input);

  if (!record) {
    return failure("PAYMENT_NOT_FOUND", "Payment not found", 404);
  }

  const refreshedRecord = await refreshPaymentRecord(record);

  return {
    data: mapPaymentRecordToSession({
      allowSimulation: config.allowSimulation,
      config,
      order: refreshedRecord.order,
      payment: refreshedRecord.payment,
    }),
    success: true,
  };
}

export async function simulatePaymentSuccessForCustomer(input: {
  customerId: string;
  paymentId: string;
}): Promise<PaymentServiceResult<PaymentSession>> {
  const config = getDemoPaymentConfig();

  // Endpoint gia lap phai bi khoa tu server, khong dua vao CSS hoac state client.
  if (!config.allowSimulation) {
    return failure("PAYMENT_DISABLED", "Mock payment simulation is unavailable", 404);
  }

  const record = await getPaymentForCustomer(input);

  if (!record) {
    return failure("PAYMENT_NOT_FOUND", "Payment not found", 404);
  }

  const refreshedRecord = await refreshPaymentRecord(record);

  if (refreshedRecord.payment.status === "PAID") {
    return {
      data: mapPaymentRecordToSession({
        allowSimulation: config.allowSimulation,
        config,
        order: refreshedRecord.order,
        payment: refreshedRecord.payment,
      }),
      success: true,
    };
  }

  if (refreshedRecord.payment.status === "EXPIRED") {
    return failure("PAYMENT_EXPIRED", "Payment has expired", 409);
  }

  if (refreshedRecord.payment.status !== "PENDING") {
    return failure("PAYMENT_INVALID_STATE", "Payment cannot be simulated", 409);
  }

  const paidAt = new Date().toISOString();
  const payload = createWebhookPayload(refreshedRecord, paidAt);
  const rawBody = JSON.stringify(payload);
  const signature = signMockWebhookPayload(rawBody);
  const webhookResult = await handleMockPaymentWebhook({
    rawBody,
    signature,
  });

  if (!webhookResult.success) {
    return webhookResult;
  }

  return getPaymentStatusForCustomer(input);
}

export async function handleMockPaymentWebhook(input: {
  rawBody: string;
  signature: string | null;
}): Promise<PaymentServiceResult<{ changed: boolean; paymentId: string }>> {
  const config = getDemoPaymentConfig();

  if (!config.allowQrDemoPayments) {
    return failure("PAYMENT_DISABLED", "Mock payment webhook is unavailable", 404);
  }

  if (!verifyMockWebhookSignature(input.rawBody, input.signature)) {
    return failure("PAYMENT_INVALID_SIGNATURE", "Invalid webhook signature", 401);
  }

  let parsedBody: unknown;

  try {
    parsedBody = JSON.parse(input.rawBody);
  } catch {
    return failure("VALIDATION_ERROR", "Invalid webhook JSON", 400);
  }

  const parsedPayload = mockPaymentWebhookPayloadSchema.safeParse(parsedBody);

  if (!parsedPayload.success) {
    return failure("VALIDATION_ERROR", "Invalid webhook payload", 400);
  }

  const record = await getPaymentForWebhook(parsedPayload.data.paymentId);

  if (!record) {
    return failure("PAYMENT_NOT_FOUND", "Payment not found", 404);
  }

  if (
    record.order.order_code !== parsedPayload.data.orderId ||
    record.payment.payment_reference !== parsedPayload.data.paymentReference
  ) {
    return failure("PAYMENT_INVALID_STATE", "Payment and order do not match", 409);
  }

  const refreshedRecord = await refreshPaymentRecord(record);

  if (refreshedRecord.payment.status === "PAID") {
    // Webhook/request lap lai phai idempotent: tra ve thanh cong nhung khong
    // ghi nhan thanh toan them lan nua.
    return {
      data: {
        changed: false,
        paymentId: refreshedRecord.payment.id,
      },
      success: true,
    };
  }

  if (refreshedRecord.payment.status === "EXPIRED") {
    return failure("PAYMENT_EXPIRED", "Payment has expired", 409);
  }

  if (refreshedRecord.payment.status !== "PENDING") {
    return failure("PAYMENT_INVALID_STATE", "Payment cannot be marked paid", 409);
  }

  // Trang thai PAID chi duoc ghi qua service server, sau khi doi chieu chu ky
  // webhook va ban ghi payment/order. Controller khong cap nhat DB truc tiep.
  await markPaymentPaid({
    paidAt: parsedPayload.data.paidAt,
    paymentId: refreshedRecord.payment.id,
  });

  return {
    data: {
      changed: true,
      paymentId: refreshedRecord.payment.id,
    },
    success: true,
  };
}

function validateOrderForPayment(
  order: PaymentOrderRow,
): PaymentServiceResult<true> {
  // So tien thanh toan luon lay tu orders.total_vnd do database tinh, khong
  // chap nhan amount tu frontend.
  if (order.total_vnd <= 0 || order.total_vnd > 999_999_999) {
    return failure("VALIDATION_ERROR", "Order total is not payable", 400);
  }

  if (order.status === "cancelled" || order.payment_status === "cancelled") {
    return failure("ORDER_CANCEL_NOT_ALLOWED", "Cancelled order cannot be paid", 409);
  }

  if (order.payment_status === "confirmed") {
    return failure("PAYMENT_ALREADY_PAID", "Order has already been paid", 409);
  }

  return { data: true, success: true };
}

async function refreshPaymentRecord(record: PaymentRecord): Promise<PaymentRecord> {
  const payment = await refreshExpiredPayment(record.payment);

  return {
    order: record.order,
    payment,
  };
}

async function refreshExpiredPayment(payment: PaymentRow) {
  if (payment.status !== "PENDING") {
    return payment;
  }

  if (new Date(payment.expires_at).getTime() > Date.now()) {
    return payment;
  }

  // Payment het han duoc chuyen trang thai tren server de reload trang van
  // thay dung ket qua, khong dua vao countdown client.
  return expirePayment(payment);
}

function createPaymentId() {
  return `pay_${crypto.randomUUID().replaceAll("-", "")}`;
}

function createPaymentReference(orderCode: string) {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();

  return `CFPAY-${orderCode.replace(/[^A-Z0-9-]/g, "")}-${suffix}`.slice(0, 88);
}

function createWebhookPayload(
  record: PaymentRecord,
  paidAt: string,
): MockPaymentWebhookPayload {
  return {
    event: "payment.paid",
    orderId: record.order.order_code,
    paidAt,
    paymentId: record.payment.id,
    paymentReference: record.payment.payment_reference,
    status: "PAID",
  };
}

export function signMockWebhookPayload(rawBody: string) {
  return `sha256=${crypto
    .createHmac("sha256", getMockPaymentWebhookSecret())
    .update(rawBody)
    .digest("hex")}`;
}

function verifyMockWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const expectedSignature = signMockWebhookPayload(rawBody);
  const normalizedSignature = signature.startsWith("sha256=")
    ? signature
    : `sha256=${signature}`;
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(normalizedSignature);

  if (expected.length !== received.length) {
    return false;
  }

  // So sanh chu ky dung timing-safe de tranh lo thong tin HMAC qua thoi gian
  // phan hoi. Secret khong bao gio duoc gui ve client hoac ghi vao log.
  return crypto.timingSafeEqual(expected, received);
}

function failure(
  code: PaymentServiceFailure["code"],
  message: string,
  status: PaymentServiceFailure["status"],
): PaymentServiceResult<never> {
  return {
    code,
    message,
    status,
    success: false,
  };
}
