import type {
  DemoPaymentProvider,
  DemoPaymentStatus,
} from "@/lib/validation/payments";
import type { OrderStatus, PaymentStatus } from "@/types/domain";

export type PaymentMerchant = {
  accountName: string;
  accountNumber: string;
  bankBin: string;
  bankName: string;
  name: string;
};

export type PaymentSession = {
  allowSimulation: boolean;
  amount: number;
  createdAt: string;
  currency: "VND";
  expiresAt: string;
  merchant: PaymentMerchant;
  order: {
    orderCode: string;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
  };
  orderId: string;
  paidAt: string | null;
  paymentContent: string;
  paymentId: string;
  paymentReference: string;
  provider: DemoPaymentProvider;
  qrPayload: string;
  serverTime: string;
  status: DemoPaymentStatus;
};

export type PaymentServiceFailure = {
  code:
    | "FORBIDDEN"
    | "ORDER_CANCEL_NOT_ALLOWED"
    | "ORDER_NOT_FOUND"
    | "PAYMENT_ALREADY_PAID"
    | "PAYMENT_DISABLED"
    | "PAYMENT_EXPIRED"
    | "PAYMENT_INVALID_SIGNATURE"
    | "PAYMENT_INVALID_STATE"
    | "PAYMENT_NOT_FOUND"
    | "PAYMENT_READ_FAILED"
    | "PAYMENT_WRITE_FAILED"
    | "VALIDATION_ERROR";
  message: string;
  status: 400 | 401 | 403 | 404 | 409 | 500;
};

export type PaymentServiceResult<TData> =
  | { data: TData; success: true }
  | (PaymentServiceFailure & { success: false });
