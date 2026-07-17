import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/types/domain";
import type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/domain";

export const CHECKOUT_SUCCESS_STORAGE_KEY =
  "caseflow-store.checkout.success.v1";
export const CHECKOUT_SUCCESS_STORAGE_VERSION = 2;

export type CheckoutSuccessOrderData = {
  order: Order;
  items: OrderItem[];
};

export type CheckoutSuccessSnapshot = {
  version: typeof CHECKOUT_SUCCESS_STORAGE_VERSION;
  orderCode: string;
  status: OrderStatus;
  subtotal: number;
  itemCount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  items: CheckoutSuccessSnapshotItem[];
};

export type CheckoutSuccessSnapshotItem = {
  productName: string;
  quantity: number;
  lineTotal: number;
};

export function createCheckoutSuccessSnapshot({
  items,
  order,
}: CheckoutSuccessOrderData): CheckoutSuccessSnapshot {
  return {
    version: CHECKOUT_SUCCESS_STORAGE_VERSION,
    orderCode: order.orderCode,
    status: order.status,
    paymentMethod: order.paymentMethod ?? "cod",
    paymentStatus: order.paymentStatus ?? "pending",
    subtotal: order.subtotal,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    createdAt: order.createdAt,
    items: items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  };
}

export function readCheckoutSuccessSnapshot(storage: Storage | null) {
  if (!storage) {
    return null;
  }

  try {
    return parseCheckoutSuccessSnapshot(
      storage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

export function writeCheckoutSuccessSnapshot(
  storage: Storage | null,
  snapshot: CheckoutSuccessSnapshot,
) {
  if (!storage) {
    return;
  }

  storage.setItem(CHECKOUT_SUCCESS_STORAGE_KEY, JSON.stringify(snapshot));
}

function parseCheckoutSuccessSnapshot(
  rawValue: string | null,
): CheckoutSuccessSnapshot | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isRecord(parsedValue)) {
      return null;
    }

    const {
      createdAt,
      itemCount,
      items,
      orderCode,
      paymentMethod,
      paymentStatus,
      status,
      subtotal,
      version,
    } = parsedValue;

    if (
      version !== CHECKOUT_SUCCESS_STORAGE_VERSION ||
      typeof orderCode !== "string" ||
      orderCode.trim().length === 0 ||
      !isOrderStatus(status) ||
      !isPaymentMethod(paymentMethod) ||
      !isPaymentStatus(paymentStatus) ||
      typeof subtotal !== "number" ||
      !Number.isFinite(subtotal) ||
      typeof itemCount !== "number" ||
      !Number.isFinite(itemCount) ||
      typeof createdAt !== "string" ||
      !Array.isArray(items) ||
      !items.every(isCheckoutSuccessSnapshotItem)
    ) {
      return null;
    }

    return {
      version: CHECKOUT_SUCCESS_STORAGE_VERSION,
      orderCode,
      paymentMethod,
      paymentStatus,
      status,
      subtotal,
      itemCount,
      createdAt,
      items,
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    ORDER_STATUSES.includes(value as OrderStatus)
  );
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    PAYMENT_METHODS.includes(value as PaymentMethod)
  );
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    PAYMENT_STATUSES.includes(value as PaymentStatus)
  );
}

function isCheckoutSuccessSnapshotItem(
  value: unknown,
): value is CheckoutSuccessSnapshotItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.productName === "string" &&
    value.productName.trim().length > 0 &&
    typeof value.quantity === "number" &&
    Number.isFinite(value.quantity) &&
    typeof value.lineTotal === "number" &&
    Number.isFinite(value.lineTotal)
  );
}
