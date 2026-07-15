import {
  categorySchema,
  orderItemSchema,
  orderSchema,
  productSchema,
} from "@/lib/validation/domain";
import type { Category, Order, OrderItem, Product } from "@/types/domain";
import type { TableRow } from "@/types/supabase";

export function mapCategoryRowToDomain(
  row: TableRow<"categories">,
): Category {
  return categorySchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapProductRowToDomain(row: TableRow<"products">): Product {
  return productSchema.parse({
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    compatibility: [...row.compatibility],
    isFeatured: row.is_featured,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapOrderRowToDomain(row: TableRow<"orders">): Order {
  return orderSchema.parse({
    id: row.id,
    orderCode: row.order_code,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    status: row.status,
    subtotal: row.subtotal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function mapOrderItemRowToDomain(
  row: TableRow<"order_items">,
): OrderItem {
  return orderItemSchema.parse({
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    lineTotal: row.line_total,
  });
}
