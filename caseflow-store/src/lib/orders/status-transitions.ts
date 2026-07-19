import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SHIPPING_STATUSES,
  type OrderStatus,
  type PaymentStatus,
  type ShippingStatus,
} from "@/types/domain";

export type OrderOperationsTransitions = {
  orderStatus: OrderStatus[];
  paymentStatus: PaymentStatus[];
  shippingStatus: ShippingStatus[];
};

const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
};

const paymentStatusTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  pending: [
    "awaiting-transfer",
    "awaiting-provider-confirmation",
    "confirmed",
    "expired",
    "failed",
    "cancelled",
  ],
  "awaiting-transfer": ["confirmed", "expired", "failed", "cancelled"],
  "awaiting-provider-confirmation": [
    "confirmed",
    "expired",
    "failed",
    "cancelled",
  ],
  confirmed: [],
  expired: [],
  failed: [],
  cancelled: [],
};

const shippingStatusTransitions: Record<ShippingStatus, ShippingStatus[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

export function getAllowedOrderStatusTargets(status: OrderStatus) {
  return uniqueStatuses(status, orderStatusTransitions[status], ORDER_STATUSES);
}

export function getAllowedPaymentStatusTargets(status: PaymentStatus) {
  return uniqueStatuses(
    status,
    paymentStatusTransitions[status],
    PAYMENT_STATUSES,
  );
}

export function getAllowedShippingStatusTargets(status: ShippingStatus) {
  return uniqueStatuses(
    status,
    shippingStatusTransitions[status],
    SHIPPING_STATUSES,
  );
}

export function getOrderOperationsTransitions(input: {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
}): OrderOperationsTransitions {
  return {
    orderStatus: getAllowedOrderStatusTargets(input.orderStatus),
    paymentStatus: getAllowedPaymentStatusTargets(input.paymentStatus),
    shippingStatus: getAllowedShippingStatusTargets(input.shippingStatus),
  };
}

export function isAllowedOrderStatusTransition(
  current: OrderStatus,
  next: OrderStatus,
) {
  return getAllowedOrderStatusTargets(current).includes(next);
}

export function isAllowedPaymentStatusTransition(
  current: PaymentStatus,
  next: PaymentStatus,
) {
  return getAllowedPaymentStatusTargets(current).includes(next);
}

export function isAllowedShippingStatusTransition(
  current: ShippingStatus,
  next: ShippingStatus,
) {
  return getAllowedShippingStatusTargets(current).includes(next);
}

function uniqueStatuses<TStatus extends string>(
  current: TStatus,
  nextStatuses: readonly TStatus[],
  allowedUniverse: readonly TStatus[],
) {
  const allowedSet = new Set<TStatus>([current, ...nextStatuses]);

  return allowedUniverse.filter((status) => allowedSet.has(status));
}
