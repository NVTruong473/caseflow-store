import type { Order, OrderItem } from "@/types/domain";
import { orderItemSchema, orderSchema } from "@/lib/validation/domain";
import type {
  CreateOrderRequest,
  UpdateOrderStatusRequest,
} from "@/lib/validation/orders";
import { validateMockCart } from "@/lib/repositories/mock-catalog";

type MockOrderRecord = {
  order: Order;
  items: OrderItem[];
};

type CreateMockOrderFailure = {
  status: 400 | 404 | 409;
  code:
    | "VALIDATION_ERROR"
    | "PRODUCT_NOT_FOUND"
    | "OUT_OF_STOCK"
    | "ORDER_CREATE_FAILED";
  message: string;
};

type CreateMockOrderResult =
  | { success: true; data: MockOrderRecord }
  | { success: false; error: CreateMockOrderFailure };

const mockOrders: MockOrderRecord[] = [];

export function listMockOrders(): MockOrderRecord[] {
  return [...mockOrders];
}

export function createMockOrder(
  request: CreateOrderRequest,
): CreateMockOrderResult {
  const cartValidation = validateMockCart(request.items);

  if (!cartValidation.success) {
    return {
      success: false,
      error: cartValidation.error,
    };
  }

  if (cartValidation.data.items.length === 0) {
    return {
      success: false,
      error: {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Order must include at least one item",
      },
    };
  }

  try {
    const now = new Date().toISOString();
    const orderId = crypto.randomUUID();

    const order = orderSchema.parse({
      id: orderId,
      orderCode: createOrderCode(),
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      shippingAddress: request.shippingAddress,
      status: "pending",
      subtotal: cartValidation.data.subtotal,
      createdAt: now,
      updatedAt: now,
    });

    const items = cartValidation.data.items.map((line) => {
      return orderItemSchema.parse({
        id: crypto.randomUUID(),
        orderId,
        productId: line.productId,
        productName: line.product.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      });
    });

    const record = { order, items };
    mockOrders.unshift(record);

    return {
      success: true,
      data: record,
    };
  } catch {
    return {
      success: false,
      error: {
        status: 400,
        code: "ORDER_CREATE_FAILED",
        message: "Order could not be created",
      },
    };
  }
}

export function updateMockOrderStatus(
  orderId: string,
  request: UpdateOrderStatusRequest,
): MockOrderRecord | null {
  const record = mockOrders.find((orderRecord) => orderRecord.order.id === orderId);

  if (!record) {
    return null;
  }

  record.order = orderSchema.parse({
    ...record.order,
    status: request.status,
    updatedAt: new Date().toISOString(),
  });

  return record;
}

function createOrderCode() {
  const timeSegment = Date.now().toString(36).toUpperCase();
  const randomSegment = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `CF-${timeSegment}-${randomSegment}`;
}
