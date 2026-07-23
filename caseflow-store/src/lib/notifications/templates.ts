import type {
  NotificationContent,
  NotificationEvent,
  NotificationLocale,
} from "@/types/notifications";
import { storefrontConfig } from "@/config/storefront";

type TemplateCopy = Record<
  NotificationLocale,
  { body: (orderCode: string) => string; subject: string; title: string }
>;

const ORDER_TEMPLATES: Record<NotificationEvent, TemplateCopy> = {
  "order.created": {
    vi: {
      body: (code) => `${storefrontConfig.name} đã tiếp nhận đơn ${code}.`,
      subject: `${storefrontConfig.name} đã tiếp nhận đơn hàng`,
      title: "Đơn hàng đã được tiếp nhận",
    },
    en: {
      body: (code) => `${storefrontConfig.name} has received order ${code}.`,
      subject: `${storefrontConfig.name} received your order`,
      title: "Order received",
    },
  },
  "order.confirmed": {
    vi: {
      body: (code) => `Đơn ${code} đã được xác nhận và đang được xử lý.`,
      subject: "Đơn hàng đã được xác nhận",
      title: "Đơn hàng đã được xác nhận",
    },
    en: {
      body: (code) => `Order ${code} has been confirmed and is being processed.`,
      subject: "Order confirmed",
      title: "Order confirmed",
    },
  },
  "order.cancelled": {
    vi: {
      body: (code) =>
        `Đơn ${code} đã được hủy. Lịch sử đơn vẫn được lưu trong tài khoản.`,
      subject: "Đơn hàng đã hủy",
      title: "Đơn hàng đã hủy",
    },
    en: {
      body: (code) =>
        `Order ${code} was cancelled. Its history remains in your account.`,
      subject: "Order cancelled",
      title: "Order cancelled",
    },
  },
  "payment.awaiting-transfer": {
    vi: {
      body: (code) =>
        `Đơn ${code} đang chờ bộ phận vận hành xác nhận chuyển khoản.`,
      subject: "Đang chờ xác nhận chuyển khoản",
      title: "Đang chờ xác nhận chuyển khoản",
    },
    en: {
      body: (code) =>
        `Order ${code} is awaiting transfer confirmation by our operations team.`,
      subject: "Awaiting transfer confirmation",
      title: "Awaiting transfer confirmation",
    },
  },
  "payment.confirmed": {
    vi: {
      body: (code) => `Thanh toán cho đơn ${code} đã được xác nhận.`,
      subject: "Thanh toán đã được xác nhận",
      title: "Thanh toán đã được xác nhận",
    },
    en: {
      body: (code) => `Payment for order ${code} has been confirmed.`,
      subject: "Payment confirmed",
      title: "Payment confirmed",
    },
  },
  "payment.rejected": {
    vi: {
      body: (code) =>
        `Thanh toán cho đơn ${code} chưa được chấp nhận. Vui lòng xem lại chi tiết đơn.`,
      subject: "Thanh toán chưa được chấp nhận",
      title: "Thanh toán chưa được chấp nhận",
    },
    en: {
      body: (code) =>
        `Payment for order ${code} was not accepted. Please review the order details.`,
      subject: "Payment not accepted",
      title: "Payment not accepted",
    },
  },
  "shipping.shipped": {
    vi: {
      body: (code) => `Đơn ${code} đã được bàn giao cho đơn vị vận chuyển.`,
      subject: "Đơn hàng đang được giao",
      title: "Đơn hàng đang được giao",
    },
    en: {
      body: (code) => `Order ${code} has been handed to the delivery service.`,
      subject: "Order shipped",
      title: "Order shipped",
    },
  },
  "order.completed": {
    vi: {
      body: (code) => `Đơn ${code} đã hoàn tất.`,
      subject: "Đơn hàng đã hoàn tất",
      title: "Đơn hàng đã hoàn tất",
    },
    en: {
      body: (code) => `Order ${code} is complete.`,
      subject: "Order completed",
      title: "Order completed",
    },
  },
  "phone.verification-requested": {
    vi: {
      body: () => "Mã xác nhận số điện thoại có hiệu lực trong 10 phút.",
      subject: `Xác nhận số điện thoại ${storefrontConfig.name}`,
      title: "Xác nhận số điện thoại",
    },
    en: {
      body: () => "Your phone verification code is valid for 10 minutes.",
      subject: `Verify your ${storefrontConfig.name} phone number`,
      title: "Verify phone number",
    },
  },
  "phone.verified": {
    vi: {
      body: () => "Số điện thoại trong tài khoản đã được xác nhận.",
      subject: "Số điện thoại đã được xác nhận",
      title: "Số điện thoại đã được xác nhận",
    },
    en: {
      body: () => "Your account phone number has been verified.",
      subject: "Phone number verified",
      title: "Phone number verified",
    },
  },
};

export function renderNotificationContent(input: {
  eventType: NotificationEvent;
  locale?: NotificationLocale;
  metadata: Record<string, unknown>;
}): NotificationContent {
  const locale = input.locale ?? "vi";
  const copy = ORDER_TEMPLATES[input.eventType][locale];
  const orderCode =
    typeof input.metadata.orderCode === "string" &&
    input.metadata.orderCode.trim().length > 0
      ? input.metadata.orderCode.trim().slice(0, 80)
      : locale === "vi"
        ? "của bạn"
        : "your order";

  return {
    body: copy.body(orderCode),
    locale,
    subject: copy.subject,
    title: copy.title,
  };
}
