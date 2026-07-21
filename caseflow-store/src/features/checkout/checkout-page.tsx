"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  Badge,
  Button,
  Container,
  ErrorMessage,
  Input,
  Skeleton,
} from "@/components/ui";
import { useCart } from "@/features/cart";
import {
  createCheckoutSuccessSnapshot,
  writeCheckoutSuccessSnapshot,
} from "@/features/checkout/checkout-success-storage";
import type { CustomerAuthState } from "@/lib/auth/customer";
import { calculateBookCheckoutTotals } from "@/lib/checkout/book-totals";
import { formatUsd, formatVnd } from "@/lib/format/currency";
import {
  formatBasisPoints,
  type CurrencyDisplayRules,
} from "@/lib/format/currency-display";
import {
  getEditionLanguageLabel,
  pickLocalizedText,
  type Language,
} from "@/lib/i18n/language";
import {
  customerEmailSchema,
  customerNameSchema,
  customerPhoneSchema,
  shippingAddressSchema,
} from "@/lib/validation/domain";
import { cn } from "@/lib/utils/cn";
import type { ValidatedCartData } from "@/types/catalog";
import type {
  BookFormat,
  CartItem,
  Order,
  OrderItem,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
  CustomerSignupVoucher,
} from "@/types/domain";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
};

type CartValidationData = ValidatedCartData;

type CreatedOrderData = {
  order: Order;
  items: OrderItem[];
};

type CartReviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: CartValidationData }
  | { status: "error"; code: string; message: string };

type CheckoutFieldName =
  | "customerName"
  | "customerEmail"
  | "customerPhone"
  | "shippingAddress";

type CheckoutFormValues = Record<CheckoutFieldName, string>;
type CheckoutFormErrors = Partial<Record<CheckoutFieldName, string>>;
type CheckoutTouchedFields = Record<CheckoutFieldName, boolean>;
type CheckoutFormStatus = "idle" | "valid";
type CheckoutSubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string };

type CheckoutMethodOption<TValue extends string> = {
  badge?: string;
  description: string;
  label: string;
  tone: CheckoutMethodTone;
  value: TValue;
};

type CheckoutMethodTone = "arrival" | "offer" | "operations" | "trust";

type CheckoutProfileRequirement = {
  blocksCheckout: boolean;
  missingFields: string[];
  state: "anonymous" | "blocked" | "ready";
};

const checkoutFieldNames: CheckoutFieldName[] = [
  "customerName",
  "customerEmail",
  "customerPhone",
  "shippingAddress",
];

const initialCheckoutFormValues: CheckoutFormValues = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingAddress: "",
};

const initialTouchedFields: CheckoutTouchedFields = {
  customerName: false,
  customerEmail: false,
  customerPhone: false,
  shippingAddress: false,
};

const checkoutCopy = {
  en: {
    availableLeft: (count: number) => `${count} left`,
    backToBooks: "Back to books",
    badge: "Book checkout",
    browseBooks: "Browse books",
    cartChecked: "Checked",
    cartChecking: "Checking",
    cartEmptyDescription: "Add at least one book before starting checkout.",
    cartEmptyTitle: "Your cart is empty.",
    cartNeedsFix: "Needs fix",
    cartReview: "Cart review",
    cartReviewReadiness:
      "Cart review must be checked before placing the order.",
    cartValidationFallback: "Cart could not be validated for checkout.",
    clearCart: "Clear cart",
    checkoutAssuranceAccount:
      "Account, phone, and delivery address are checked before confirmation.",
    checkoutAssurancePolicies:
      "Shipping, payment, and returns policies stay available during checkout.",
    checkoutAssuranceTitle: "Checkout confidence",
    checkoutAssuranceTotals:
      "Prices, stock, VAT estimate, shipping, payment fee, and promotion are recalculated from store rules.",
    contactAndShipping: "Contact and shipping",
    contactConfirmation: "Customer/contact confirmation",
    contactConfirmationDescription:
      "Order contact details come from your customer account.",
    creatingOrder: "Creating order",
    customerDetailsValid:
      "Customer details are valid for the next checkout step.",
    description:
      "Review current stock, confirm shipping details, choose a payment method, and place the order for bookstore confirmation.",
    emailError: "Enter your email address.",
    emailHint: "A confirmation can be sent here later.",
    emailInvalid: "Enter a valid email address.",
    emailLabel: "Email",
    formDescription:
      "Contact details are used for the order record.",
    fullNameError: "Enter your full name.",
    fullNameHint: "Use the name for order support.",
    fullNameInvalid: "Name must be 120 characters or fewer.",
    fullNameLabel: "Full name",
    item: "item",
    items: "items",
    networkError: "Cart validation is unavailable. Try again before ordering.",
    noCardFields:
      "Choose a payment method for the order. The bookstore confirms transfer or provider status before fulfillment.",
    openCart: "Open cart",
    orderCouldNotBeCreated:
      "Order could not be created. Review the cart and try again.",
    orderServiceUnavailable:
      "Order service is unavailable. Try again before ordering.",
    orderSummary: "Order summary",
    orderSummaryDescription:
      "Totals are recalculated after cart validation.",
    orderSummaryNext:
      "Final totals are checked again before the order is recorded.",
    orderTotal: "Order total",
    payment: "Payment",
    paymentBankDescription:
      "Primary prepaid choice. Transfer details are reviewed with the order before fulfillment.",
    paymentBankLabel: "Bank transfer",
    paymentCodDescription:
      "Primary Vietnam choice. Pay on receipt when the bookstore delivery is handed over.",
    paymentCodLabel: "Cash on delivery",
    paymentGatewayBadge: "Gateway choice",
    paymentMethodTitle: "Payment method",
    paymentLabel: "Payment pending",
    paymentMockQrDescription:
      "Sandbox QR gateway for checking a full payment-status flow without real money movement.",
    paymentMomoLabel: "Simulated QR gateway",
    paymentPolicyLink: "Payment policy",
    paymentPrimaryBadge: "Primary",
    paymentProviderDescription:
      "Selected at checkout; the order remains awaiting payment confirmation before fulfillment.",
    paymentVnpayLabel: "VNPay",
    paymentVietQrDescription:
      "Sandbox VietQR transfer details generated from the server-owned order total.",
    paymentVietQrLabel: "VietQR Demo",
    paymentWalletBadge: "Wallet choice",
    paymentZalopayLabel: "ZaloPay",
    paymentFee: "Payment fee",
    phoneError: "Enter your phone number.",
    phoneHint: "Digits, spaces, +, -, parentheses, and dots are accepted.",
    phoneInvalid: "Enter a phone number using 7-24 digits and phone symbols.",
    phoneLabel: "Phone",
    placeOrder: "Place order",
    promotionCode: "Promotion code",
    promotionDiscount: "Promotion discount",
    promotionHint:
      "Use one account welcome code per order, or enter another active store code.",
    promotionVoucherApplied: "Applied",
    promotionVoucherApply: "Use this code",
    promotionVoucherDescription:
      "Your account includes welcome codes from registration. Only one code can be applied to this order.",
    promotionVoucherExpired: "Expired",
    promotionVoucherReserved: "Reserved",
    promotionVoucherTitle: "Available account codes",
    promotionVoucherUsed: "Used",
    promotionVoucherValidUntil: "Valid until",
    policyLinksTitle: "Store policies",
    profileComplete:
      "Customer profile is complete. Checkout details are prefilled from your account where available.",
    profileIncomplete:
      "Complete your customer profile before placing an account-based order.",
    profileRequirementTitle: "Customer profile requirement",
    profileRequiredAction: "Complete profile",
    resolveCartReview:
      "Resolve cart review before placing the order.",
    shipping: "Shipping",
    shippingAddressError: "Enter your shipping address.",
    shippingAddressHint:
      "Street, ward or district, city, and delivery note if needed.",
    shippingAddressInvalid:
      "Shipping address must be 500 characters or fewer.",
    shippingAddressLabel: "Shipping address",
    shippingExpressDescription:
      "Faster delivery estimate for Vietnam addresses after order review.",
    shippingExpressLabel: "Express delivery",
    shippingLabel: "Shipping estimate",
    shippingMethodTitle: "Shipping method",
    shippingPolicyLink: "Shipping policy",
    shippingStandardDescription:
      "Recommended for most local bookstore deliveries.",
    shippingStandardLabel: "Standard delivery",
    stepCart: "1. Cart review",
    stepContact: "2. Customer/contact",
    stepPayment: "4. Payment method",
    stepShipping: "3. Shipping method",
    stepSubmit: "5. Review and submit",
    subtotal: "Subtotal",
    title: "Checkout",
    updateProfile: "Update profile",
    usdEstimate: "Approx. USD total",
    usdEstimateFee: "Estimated international payment fee",
    usdEstimateSource: "Rate source",
    returnsPolicyLink: "Returns policy",
    vndAuthoritative:
      "VND remains the checkout currency; USD is an estimate for comparison.",
    vatEstimate: "VAT estimate",
  },
  vi: {
    availableLeft: (count: number) => `Còn ${count}`,
    backToBooks: "Quay lại danh sách sách",
    badge: "Thanh toán sách",
    browseBooks: "Duyệt sách",
    cartChecked: "Đã kiểm tra",
    cartChecking: "Đang kiểm tra",
    cartEmptyDescription: "Hãy thêm ít nhất một cuốn sách trước khi thanh toán.",
    cartEmptyTitle: "Giỏ hàng của bạn đang trống.",
    cartNeedsFix: "Cần xử lý",
    cartReview: "Kiểm tra giỏ hàng",
    cartReviewReadiness:
      "Cần kiểm tra giỏ hàng trước khi đặt đơn.",
    cartValidationFallback: "Không thể kiểm tra giỏ hàng cho bước thanh toán.",
    clearCart: "Xóa giỏ hàng",
    checkoutAssuranceAccount:
      "Tài khoản, số điện thoại và địa chỉ giao hàng được kiểm tra trước khi xác nhận.",
    checkoutAssurancePolicies:
      "Chính sách giao hàng, thanh toán và đổi trả luôn có sẵn trong bước thanh toán.",
    checkoutAssuranceTitle: "Độ tin cậy thanh toán",
    checkoutAssuranceTotals:
      "Giá, tồn kho, VAT ước tính, phí giao hàng, phí thanh toán và khuyến mãi được tính lại từ quy tắc cửa hàng.",
    contactAndShipping: "Thông tin liên hệ và giao hàng",
    contactConfirmation: "Xác nhận khách hàng/liên hệ",
    contactConfirmationDescription:
      "Thông tin liên hệ đơn hàng lấy từ tài khoản khách hàng.",
    creatingOrder: "Đang tạo đơn",
    customerDetailsValid:
      "Thông tin khách hàng hợp lệ cho bước thanh toán tiếp theo.",
    description:
      "Kiểm tra tồn kho hiện tại, xác nhận thông tin giao hàng, chọn phương thức thanh toán và đặt đơn để nhà sách xác nhận.",
    emailError: "Nhập email của bạn.",
    emailHint: "Sau này có thể gửi xác nhận tới email này.",
    emailInvalid: "Nhập email hợp lệ.",
    emailLabel: "Email",
    formDescription:
      "Thông tin liên hệ được dùng cho đơn hàng hiện tại.",
    fullNameError: "Nhập họ và tên.",
    fullNameHint: "Dùng tên này để hỗ trợ đơn hàng.",
    fullNameInvalid: "Tên phải từ 120 ký tự trở xuống.",
    fullNameLabel: "Họ và tên",
    item: "sản phẩm",
    items: "sản phẩm",
    networkError: "Chưa thể kiểm tra giỏ hàng. Vui lòng thử lại trước khi đặt.",
    noCardFields:
      "Chọn phương thức thanh toán cho đơn hàng. Nhà sách sẽ xác nhận chuyển khoản hoặc trạng thái nhà cung cấp trước khi xử lý.",
    openCart: "Mở giỏ hàng",
    orderCouldNotBeCreated:
      "Không thể tạo đơn hàng. Hãy kiểm tra giỏ hàng rồi thử lại.",
    orderServiceUnavailable:
      "Dịch vụ đơn hàng chưa khả dụng. Vui lòng thử lại trước khi đặt.",
    orderSummary: "Tóm tắt đơn hàng",
    orderSummaryDescription:
      "Tổng tiền được tính lại sau khi kiểm tra giỏ hàng.",
    orderSummaryNext:
      "Tổng cuối cùng được kiểm tra lại trước khi đơn hàng được ghi nhận.",
    orderTotal: "Tổng đơn hàng",
    payment: "Thanh toán",
    paymentBankDescription:
      "Lựa chọn trả trước ưu tiên. Thông tin chuyển khoản được kiểm tra cùng đơn trước khi xử lý.",
    paymentBankLabel: "Chuyển khoản",
    paymentCodDescription:
      "Lựa chọn ưu tiên tại Việt Nam. Thanh toán khi đơn được bàn giao.",
    paymentCodLabel: "COD",
    paymentGatewayBadge: "Cổng thanh toán",
    paymentMethodTitle: "Phương thức thanh toán",
    paymentLabel: "Chờ thanh toán",
    paymentMockQrDescription:
      "Cổng QR sandbox để kiểm tra trọn luồng trạng thái thanh toán mà không chuyển tiền thật.",
    paymentMomoLabel: "Cổng QR giả lập",
    paymentPolicyLink: "Chính sách thanh toán",
    paymentPrimaryBadge: "Ưu tiên",
    paymentProviderDescription:
      "Được chọn trong bước thanh toán; đơn sẽ chờ xác nhận thanh toán trước khi xử lý.",
    paymentVnpayLabel: "VNPay",
    paymentVietQrDescription:
      "Thông tin VietQR sandbox được tạo từ tổng đơn hàng do server xác định.",
    paymentVietQrLabel: "VietQR Demo",
    paymentWalletBadge: "Ví điện tử",
    paymentZalopayLabel: "ZaloPay",
    paymentFee: "Phí thanh toán",
    phoneError: "Nhập số điện thoại.",
    phoneHint: "Chấp nhận chữ số, khoảng trắng, +, -, ngoặc và dấu chấm.",
    phoneInvalid:
      "Nhập số điện thoại gồm 7-24 chữ số và ký hiệu điện thoại.",
    phoneLabel: "Số điện thoại",
    placeOrder: "Đặt đơn",
    promotionCode: "Mã khuyến mãi",
    promotionDiscount: "Giảm giá",
    promotionHint:
      "Mỗi đơn dùng một mã chào mừng của tài khoản, hoặc nhập mã cửa hàng còn hiệu lực.",
    promotionVoucherApplied: "Đã áp dụng",
    promotionVoucherApply: "Dùng mã này",
    promotionVoucherDescription:
      "Tài khoản của bạn có mã chào mừng từ lúc đăng ký. Mỗi đơn chỉ áp dụng một mã.",
    promotionVoucherExpired: "Hết hạn",
    promotionVoucherReserved: "Đang giữ",
    promotionVoucherTitle: "Mã tài khoản có thể dùng",
    promotionVoucherUsed: "Đã dùng",
    promotionVoucherValidUntil: "Hạn dùng",
    policyLinksTitle: "Chính sách cửa hàng",
    profileComplete:
      "Hồ sơ khách hàng đã đủ. Thông tin thanh toán được điền từ tài khoản nếu có.",
    profileIncomplete:
      "Hoàn tất hồ sơ khách hàng trước khi đặt đơn bằng tài khoản.",
    profileRequirementTitle: "Yêu cầu hồ sơ khách hàng",
    profileRequiredAction: "Hoàn tất hồ sơ",
    resolveCartReview: "Hãy xử lý kiểm tra giỏ hàng trước khi đặt đơn.",
    shipping: "Giao hàng",
    shippingAddressError: "Nhập địa chỉ giao hàng.",
    shippingAddressHint:
      "Đường, phường/xã hoặc quận/huyện, thành phố và ghi chú giao hàng nếu cần.",
    shippingAddressInvalid:
      "Địa chỉ giao hàng phải từ 500 ký tự trở xuống.",
    shippingAddressLabel: "Địa chỉ giao hàng",
    shippingExpressDescription:
      "Ước tính giao nhanh cho địa chỉ tại Việt Nam sau khi đơn được kiểm tra.",
    shippingExpressLabel: "Giao nhanh",
    shippingLabel: "Phí giao hàng ước tính",
    shippingMethodTitle: "Phương thức giao hàng",
    shippingPolicyLink: "Chính sách giao hàng",
    shippingStandardDescription: "Phù hợp với đa số đơn sách nội địa.",
    shippingStandardLabel: "Giao tiêu chuẩn",
    stepCart: "1. Kiểm tra giỏ hàng",
    stepContact: "2. Khách hàng/liên hệ",
    stepPayment: "4. Phương thức thanh toán",
    stepShipping: "3. Phương thức giao hàng",
    stepSubmit: "5. Kiểm tra và đặt đơn",
    subtotal: "Tạm tính",
    title: "Thanh toán",
    updateProfile: "Cập nhật hồ sơ",
    usdEstimate: "Tổng USD ước tính",
    usdEstimateFee: "Phí thanh toán quốc tế ước tính",
    usdEstimateSource: "Nguồn tỷ giá",
    returnsPolicyLink: "Chính sách đổi trả",
    vndAuthoritative:
      "VND vẫn là tiền tệ thanh toán; USD là ước tính để so sánh.",
    vatEstimate: "VAT ước tính",
  },
} as const;

export function CheckoutPage({
  currencyRules,
  customerAuthState,
  language,
  qrDemoPaymentsEnabled,
  signupVouchers,
}: {
  currencyRules: CurrencyDisplayRules;
  customerAuthState: CustomerAuthState;
  language: Language;
  qrDemoPaymentsEnabled: boolean;
  signupVouchers: CustomerSignupVoucher[];
}) {
  const copy = checkoutCopy[language];
  const { clearCart, hasLoadedStorage, items, openCart, totalQuantity } =
    useCart();
  const [reviewState, setReviewState] = React.useState<CartReviewState>({
    status: "idle",
  });
  const [shippingMethod, setShippingMethod] =
    React.useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("cod");
  const [promotionCode, setPromotionCode] = React.useState("");
  const estimatedPromotionDiscountVnd =
    reviewState.status === "success"
      ? getSelectedSignupVoucherDiscountVnd({
          promotionCode,
          subtotalVnd: reviewState.data.subtotal,
          vouchers: signupVouchers,
        })
      : 0;

  React.useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    const abortController = new AbortController();

    async function validateCart() {
      setReviewState({ status: "loading" });

      try {
        const response = await fetch("/api/cart/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items }),
          signal: abortController.signal,
        });
        const payload =
          (await response.json()) as ApiResponse<CartValidationData>;

        if (!response.ok || payload.error || !payload.data) {
          setReviewState({
            status: "error",
            code: payload.error?.code ?? "VALIDATION_ERROR",
            message: payload.error?.message ?? copy.cartValidationFallback,
          });
          return;
        }

        setReviewState({ status: "success", data: payload.data });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setReviewState({
          status: "error",
          code: "NETWORK_ERROR",
          message: copy.networkError,
        });
      }
    }

    void validateCart();

    return () => abortController.abort();
  }, [copy.cartValidationFallback, copy.networkError, hasLoadedStorage, items]);

  const isCartEmpty = hasLoadedStorage && items.length === 0;

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-checkout-page
    >
      <Container className="flex flex-col gap-case-xl">
        <div className="flex flex-col gap-case-md">
          <Link
            href="/#featured"
            className="text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.backToBooks}
          </Link>
          <div className="flex max-w-3xl flex-col gap-case-sm">
            <Badge variant="primary">{copy.badge}</Badge>
            <h1 className="text-heading-1 font-semibold text-foreground">
              {copy.title}
            </h1>
            <p className="text-body leading-7 text-text-muted">
              {copy.description}
            </p>
          </div>
          <CheckoutAssuranceStrip copy={copy} />
        </div>

        {!hasLoadedStorage ? (
          <CheckoutLoadingState />
        ) : isCartEmpty ? (
          <CheckoutEmptyState copy={copy} />
        ) : (
          <div className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <CheckoutDetailsForm
              clearCart={clearCart}
              copy={copy}
              customerAuthState={customerAuthState}
              currencyRules={currencyRules}
              items={items}
              language={language}
              paymentMethod={paymentMethod}
              estimatedPromotionDiscountVnd={estimatedPromotionDiscountVnd}
              promotionCode={promotionCode}
              qrDemoPaymentsEnabled={qrDemoPaymentsEnabled}
              reviewState={reviewState}
              setPaymentMethod={setPaymentMethod}
              setPromotionCode={setPromotionCode}
              setShippingMethod={setShippingMethod}
              shippingMethod={shippingMethod}
              signupVouchers={signupVouchers}
            />
            <CheckoutCartReview
              clearCart={clearCart}
              copy={copy}
              currencyRules={currencyRules}
              language={language}
              openCart={openCart}
              paymentMethod={paymentMethod}
              estimatedPromotionDiscountVnd={estimatedPromotionDiscountVnd}
              reviewState={reviewState}
              shippingMethod={shippingMethod}
              totalQuantity={totalQuantity}
            />
          </div>
        )}
      </Container>
    </main>
  );
}

function getCheckoutFieldError(
  copy: (typeof checkoutCopy)[Language],
  fieldName: CheckoutFieldName,
  value: string,
): string | null {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    switch (fieldName) {
      case "customerName":
        return copy.fullNameError;
      case "customerEmail":
        return copy.emailError;
      case "customerPhone":
        return copy.phoneError;
      case "shippingAddress":
        return copy.shippingAddressError;
    }
  }

  switch (fieldName) {
    case "customerName":
      return customerNameSchema.safeParse(value).success
        ? null
        : copy.fullNameInvalid;
    case "customerEmail":
      return customerEmailSchema.safeParse(value).success
        ? null
        : copy.emailInvalid;
    case "customerPhone":
      return customerPhoneSchema.safeParse(value).success
        ? null
        : copy.phoneInvalid;
    case "shippingAddress":
      return shippingAddressSchema.safeParse(value).success
        ? null
        : copy.shippingAddressInvalid;
  }
}

function validateCheckoutForm(
  copy: (typeof checkoutCopy)[Language],
  values: CheckoutFormValues,
) {
  const errors: CheckoutFormErrors = {};

  for (const fieldName of checkoutFieldNames) {
    const error = getCheckoutFieldError(copy, fieldName, values[fieldName]);

    if (error) {
      errors[fieldName] = error;
    }
  }

  return errors;
}

function hasCheckoutFormErrors(errors: CheckoutFormErrors) {
  return Object.keys(errors).length > 0;
}

function markAllFieldsTouched(): CheckoutTouchedFields {
  return {
    customerName: true,
    customerEmail: true,
    customerPhone: true,
    shippingAddress: true,
  };
}

function normalizeCheckoutFormValues(
  values: CheckoutFormValues,
): CheckoutFormValues {
  return {
    customerName: values.customerName.trim(),
    customerEmail: values.customerEmail.trim(),
    customerPhone: values.customerPhone.trim(),
    shippingAddress: values.shippingAddress.trim(),
  };
}

function getValidatedItemCount(data: CartValidationData) {
  return data.items.reduce((total, line) => total + line.quantity, 0);
}

function CheckoutLoadingState() {
  return (
    <div
      className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_420px]"
      data-checkout-loading
    >
      <section className="rounded-lg border border-border bg-surface p-case-lg">
        <Skeleton className="h-7 w-48" />
        <div className="mt-case-lg grid gap-case-md sm:grid-cols-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface p-case-lg">
        <Skeleton className="h-7 w-40" />
        <div className="mt-case-lg flex flex-col gap-case-sm">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-12" />
        </div>
      </section>
    </div>
  );
}

function CheckoutEmptyState({
  copy,
}: {
  copy: (typeof checkoutCopy)[Language];
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-xl"
      data-checkout-empty
    >
      <div className="flex max-w-xl flex-col gap-case-md">
        <h2 className="text-heading-2 font-semibold text-foreground">
          {copy.cartEmptyTitle}
        </h2>
        <p className="text-body leading-7 text-text-muted">
          {copy.cartEmptyDescription}
        </p>
        <Link
          href="/#featured"
          className="inline-flex min-h-11 w-fit min-w-0 items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-body font-medium text-surface transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {copy.browseBooks}
        </Link>
      </div>
    </section>
  );
}

function CheckoutAssuranceStrip({
  copy,
}: {
  copy: (typeof checkoutCopy)[Language];
}) {
  const assuranceItems = [
    copy.checkoutAssuranceAccount,
    copy.checkoutAssuranceTotals,
    copy.checkoutAssurancePolicies,
  ];

  return (
    <section
      className="grid gap-case-sm rounded-lg border border-trust/25 bg-trust-muted p-case-md md:grid-cols-3"
      data-checkout-assurance
    >
      <h2 className="sr-only">{copy.checkoutAssuranceTitle}</h2>
      {assuranceItems.map((item, index) => (
        <p
          key={item}
          className="min-w-0 rounded-md border border-trust/20 bg-surface p-case-sm text-small leading-6 text-text-muted"
          data-checkout-assurance-item={index + 1}
        >
          {item}
        </p>
      ))}
    </section>
  );
}

function CheckoutPolicyLinks({
  copy,
}: {
  copy: (typeof checkoutCopy)[Language];
}) {
  const links = [
    { href: "/shipping", label: copy.shippingPolicyLink },
    { href: "/payment", label: copy.paymentPolicyLink },
    { href: "/returns", label: copy.returnsPolicyLink },
  ];

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-case-sm rounded-md border border-border bg-paper p-case-sm"
      data-checkout-policy-links
    >
      <span className="text-small font-semibold text-foreground">
        {copy.policyLinksTitle}
      </span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function CheckoutDetailsForm({
  clearCart,
  copy,
  currencyRules,
  customerAuthState,
  items,
  language,
  paymentMethod,
  estimatedPromotionDiscountVnd,
  promotionCode,
  qrDemoPaymentsEnabled,
  reviewState,
  setPaymentMethod,
  setPromotionCode,
  setShippingMethod,
  shippingMethod,
  signupVouchers,
}: {
  clearCart: () => void;
  copy: (typeof checkoutCopy)[Language];
  currencyRules: CurrencyDisplayRules;
  customerAuthState: CustomerAuthState;
  items: CartItem[];
  language: Language;
  paymentMethod: PaymentMethod;
  estimatedPromotionDiscountVnd: number;
  promotionCode: string;
  qrDemoPaymentsEnabled: boolean;
  reviewState: CartReviewState;
  setPaymentMethod: (paymentMethod: PaymentMethod) => void;
  setPromotionCode: (promotionCode: string) => void;
  setShippingMethod: (shippingMethod: ShippingMethod) => void;
  shippingMethod: ShippingMethod;
  signupVouchers: CustomerSignupVoucher[];
}) {
  const router = useRouter();
  const initialValues = React.useMemo(
    () => getInitialCheckoutFormValues(customerAuthState),
    [customerAuthState],
  );
  const profileRequirement = getCheckoutProfileRequirement(customerAuthState);
  const shippingAddress = getCheckoutShippingAddress(customerAuthState);
  const [values, setValues] = React.useState<CheckoutFormValues>(
    initialValues,
  );
  const [errors, setErrors] = React.useState<CheckoutFormErrors>({});
  const [touchedFields, setTouchedFields] =
    React.useState<CheckoutTouchedFields>(initialTouchedFields);
  const [formStatus, setFormStatus] =
    React.useState<CheckoutFormStatus>("idle");
  const [submitState, setSubmitState] = React.useState<CheckoutSubmitState>({
    status: "idle",
  });
  const isSubmitting = submitState.status === "submitting";
  const isCartReadyForOrder = reviewState.status === "success";

  function validateField(fieldName: CheckoutFieldName) {
    setTouchedFields((currentTouchedFields) => ({
      ...currentTouchedFields,
      [fieldName]: true,
    }));
    setErrors((currentErrors) => {
      const fieldError = getCheckoutFieldError(
        copy,
        fieldName,
        values[fieldName],
      );
      const nextErrors = { ...currentErrors };

      if (fieldError) {
        nextErrors[fieldName] = fieldError;
      } else {
        delete nextErrors[fieldName];
      }

      return nextErrors;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedValues = normalizeCheckoutFormValues(values);
    const nextErrors = validateCheckoutForm(copy, normalizedValues);

    setValues(normalizedValues);
    setTouchedFields(markAllFieldsTouched());
    setErrors(nextErrors);

    if (hasCheckoutFormErrors(nextErrors)) {
      setFormStatus("idle");
      setSubmitState({ status: "idle" });
      return;
    }

    setFormStatus("valid");

    if (profileRequirement.blocksCheckout) {
      setSubmitState({
        status: "error",
        message: copy.profileIncomplete,
      });
      return;
    }

    if (!shippingAddress) {
      setSubmitState({
        status: "error",
        message: copy.profileIncomplete,
      });
      return;
    }

    if (reviewState.status !== "success") {
      setSubmitState({
        status: "error",
        message: copy.resolveCartReview,
      });
      return;
    }

    setSubmitState({ status: "submitting" });
    const normalizedPromotionCode = promotionCode.trim().toUpperCase();

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...normalizedValues,
          paymentMethod,
          promotionCode: normalizedPromotionCode || undefined,
          shippingAddress,
          shippingMethod,
          items,
        }),
      });
      const payload = (await response.json()) as ApiResponse<CreatedOrderData>;

      if (!response.ok || payload.error || !payload.data) {
        setSubmitState({
          status: "error",
          message:
            payload.error?.message ?? copy.orderCouldNotBeCreated,
        });
        return;
      }

      writeCheckoutSuccessSnapshot(
        window.sessionStorage,
        createCheckoutSuccessSnapshot(payload.data),
      );
      clearCart();

      if (
        qrDemoPaymentsEnabled &&
        (paymentMethod === "momo" || paymentMethod === "vnpay")
      ) {
        router.push(
          `/checkout/payment?orderCode=${encodeURIComponent(
            payload.data.order.orderCode,
          )}&provider=${paymentMethod === "vnpay" ? "DEMO_VIETQR" : "MOCK_GATEWAY"}`,
        );
        return;
      }

      router.push(
        `/checkout/success?orderCode=${encodeURIComponent(
          payload.data.order.orderCode,
        )}`,
      );
    } catch {
      setSubmitState({
        status: "error",
        message: copy.orderServiceUnavailable,
      });
    }
  }

  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      data-checkout-form-shell
      data-checkout-form-status={formStatus}
      data-checkout-profile-state={
        profileRequirement.blocksCheckout ? "blocked" : "ready"
      }
    >
      <div className="flex flex-col gap-case-sm">
        <h2 className="text-heading-2 font-semibold text-foreground">
          {copy.contactAndShipping}
        </h2>
        <p className="text-body leading-7 text-text-muted">
          {copy.formDescription}
        </p>
        <CheckoutProfileRequirementPanel
          copy={copy}
          profileRequirement={profileRequirement}
        />
      </div>

      <form
        className="mt-case-lg grid gap-case-lg"
        onSubmit={handleSubmit}
        noValidate
        data-checkout-form
      >
        <CheckoutStep
          description={copy.contactConfirmationDescription}
          title={copy.stepContact}
        >
          <div className="grid gap-case-md sm:grid-cols-2">
            <Input
              id="checkout-customer-name"
              label={copy.fullNameLabel}
              name="customerName"
              autoComplete="name"
              value={values.customerName}
              onBlur={() => validateField("customerName")}
              error={
                touchedFields.customerName ? errors.customerName : undefined
              }
              hint={copy.fullNameHint}
              readOnly
              data-checkout-customer-name
            />
            <Input
              id="checkout-customer-email"
              label={copy.emailLabel}
              name="customerEmail"
              type="email"
              autoComplete="email"
              value={values.customerEmail}
              onBlur={() => validateField("customerEmail")}
              error={
                touchedFields.customerEmail ? errors.customerEmail : undefined
              }
              hint={copy.emailHint}
              readOnly
              data-checkout-customer-email
            />
            <Input
              id="checkout-customer-phone"
              label={copy.phoneLabel}
              name="customerPhone"
              type="tel"
              autoComplete="tel"
              value={values.customerPhone}
              onBlur={() => validateField("customerPhone")}
              error={
                touchedFields.customerPhone ? errors.customerPhone : undefined
              }
              hint={copy.phoneHint}
              readOnly
              data-checkout-customer-phone
            />
            <Input
              id="checkout-shipping-address"
              label={copy.shippingAddressLabel}
              name="shippingAddress"
              autoComplete="street-address"
              value={values.shippingAddress}
              onBlur={() => validateField("shippingAddress")}
              error={
                touchedFields.shippingAddress
                  ? errors.shippingAddress
                  : undefined
              }
              hint={copy.shippingAddressHint}
              readOnly
              data-checkout-shipping-address
            />
          </div>
          <Link
            href="/account?next=/checkout"
            className="inline-flex w-fit text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.updateProfile}
          </Link>
        </CheckoutStep>

        <CheckoutStep title={copy.stepShipping}>
          <CheckoutMethodChoiceGroup
            name="shippingMethod"
            onChange={(value) => {
              setShippingMethod(value);
              setSubmitState({ status: "idle" });
            }}
            options={getShippingMethodOptions(copy)}
            value={shippingMethod}
          />
        </CheckoutStep>

        <CheckoutStep title={copy.stepPayment}>
          <CheckoutMethodChoiceGroup
            name="paymentMethod"
            onChange={(value) => {
              setPaymentMethod(value);
              setSubmitState({ status: "idle" });
            }}
            options={getPaymentMethodOptions(copy, qrDemoPaymentsEnabled)}
            value={paymentMethod}
          />
          <CheckoutPolicyLinks copy={copy} />
        </CheckoutStep>

        <CheckoutStep title={copy.promotionCode}>
          <CheckoutVoucherChooser
            copy={copy}
            language={language}
            promotionCode={promotionCode}
            setPromotionCode={(code) => {
              setPromotionCode(code);
              setSubmitState({ status: "idle" });
            }}
            vouchers={signupVouchers}
          />
          <Input
            id="checkout-promotion-code"
            label={copy.promotionCode}
            value={promotionCode}
            onChange={(event) => {
              setPromotionCode(event.target.value.toUpperCase());
              setSubmitState({ status: "idle" });
            }}
            hint={copy.promotionHint}
            autoComplete="off"
            data-checkout-promotion-code
          />
        </CheckoutStep>

        <CheckoutStep
          description={copy.orderSummaryNext}
          title={copy.stepSubmit}
        >
          {reviewState.status === "success" ? (
            <CheckoutTotalsBreakdown
              copy={copy}
              currencyRules={currencyRules}
              data={reviewState.data}
              discountTotalVnd={estimatedPromotionDiscountVnd}
              language={language}
              paymentMethod={paymentMethod}
              shippingMethod={shippingMethod}
              totalDataAttribute="data-checkout-final-total"
            />
          ) : (
            <p
              className="text-small leading-6 text-text-muted"
              data-checkout-submit-readiness
            >
              {copy.cartReviewReadiness}
            </p>
          )}
        </CheckoutStep>

        <div className="flex flex-col gap-case-sm border-t border-border pt-case-md sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-small text-text-muted">
              {copy.noCardFields}
            </p>
            {formStatus === "valid" ? (
              <p
                role="status"
                className="mt-case-xs text-small font-medium text-success"
                data-checkout-customer-validation-success
              >
                {copy.customerDetailsValid}
              </p>
            ) : null}
            {submitState.status === "error" ? (
              <div className="mt-case-sm" data-checkout-submit-error>
                <ErrorMessage>{submitState.message}</ErrorMessage>
              </div>
            ) : null}
            {!isCartReadyForOrder ? (
              <p
                className="mt-case-xs text-small text-text-muted"
                data-checkout-submit-readiness
              >
                {copy.cartReviewReadiness}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={
              !isCartReadyForOrder ||
              profileRequirement.blocksCheckout ||
              !shippingAddress
            }
            isLoading={isSubmitting}
            data-checkout-submit
          >
            {isSubmitting ? copy.creatingOrder : copy.placeOrder}
          </Button>
        </div>
      </form>
    </section>
  );
}

function CheckoutStep({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="grid gap-case-md border-t border-border pt-case-md">
      <div className="min-w-0">
        <h3 className="text-heading-3 font-semibold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-case-xs text-small leading-6 text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function CheckoutVoucherChooser({
  copy,
  language,
  promotionCode,
  setPromotionCode,
  vouchers,
}: {
  copy: (typeof checkoutCopy)[Language];
  language: Language;
  promotionCode: string;
  setPromotionCode: (code: string) => void;
  vouchers: CustomerSignupVoucher[];
}) {
  if (vouchers.length === 0) {
    return null;
  }

  return (
    <div
      className="case-retail-red-band rounded-lg border border-primary/20 p-case-md"
      data-checkout-signup-vouchers
    >
      <div className="flex min-w-0 flex-col gap-case-xs">
        <Badge variant="primary">{copy.promotionVoucherTitle}</Badge>
        <p className="text-small leading-6 text-text-muted">
          {copy.promotionVoucherDescription}
        </p>
      </div>
      <div className="mt-case-md grid gap-case-sm md:grid-cols-3">
        {vouchers.map((voucher) => {
          const isAvailable = voucher.status === "available";
          const isSelected = promotionCode.trim().toUpperCase() === voucher.code;

          return (
            <div
              key={voucher.id}
              className="flex min-w-0 flex-col gap-case-sm rounded-md border border-border bg-surface p-case-sm"
              data-checkout-signup-voucher={voucher.code}
              data-checkout-signup-voucher-status={voucher.status}
            >
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{voucher.code}</p>
                <p className="mt-1 text-small leading-6 text-text-muted">
                  {voucher.name[language]}
                </p>
                <p className="mt-1 text-small font-semibold text-primary">
                  {getVoucherDiscountLabel(voucher, language)}
                </p>
                <p className="mt-1 text-small text-text-muted">
                  {copy.promotionVoucherValidUntil}:{" "}
                  {formatCheckoutVoucherDate(voucher.expiresAt, language)}
                </p>
              </div>
              {isAvailable ? (
                <Button
                  type="button"
                  variant={isSelected ? "primary" : "secondary"}
                  onClick={() => setPromotionCode(voucher.code)}
                  data-checkout-apply-signup-voucher={voucher.code}
                >
                  {isSelected
                    ? copy.promotionVoucherApplied
                    : copy.promotionVoucherApply}
                </Button>
              ) : (
                <Badge
                  className="self-start"
                  variant={getCheckoutVoucherBadgeVariant(voucher.status)}
                >
                  {getCheckoutVoucherStatusLabel(voucher.status, copy)}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckoutMethodChoiceGroup<TValue extends PaymentMethod | ShippingMethod>({
  name,
  onChange,
  options,
  value,
}: {
  name: "paymentMethod" | "shippingMethod";
  onChange: (value: TValue) => void;
  options: CheckoutMethodOption<TValue>[];
  value: TValue;
}) {
  return (
    <div
      className="grid gap-case-sm sm:grid-cols-2"
      role="radiogroup"
      data-checkout-method-group={name}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex min-w-0 cursor-pointer gap-case-sm rounded-md border bg-surface p-case-md transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5",
            getCheckoutMethodToneClass(option.tone),
          )}
          data-checkout-payment-method={
            name === "paymentMethod" ? option.value : undefined
          }
          data-checkout-shipping-method={
            name === "shippingMethod" ? option.value : undefined
          }
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="mt-1 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="min-w-0">
            <span className="flex min-w-0 flex-wrap items-center gap-case-xs">
              <span className="font-medium text-foreground">{option.label}</span>
              {option.badge ? (
                <Badge className={getCheckoutMethodBadgeClass(option.tone)} size="sm">
                  {option.badge}
                </Badge>
              ) : null}
            </span>
            <span className="mt-case-xs block text-small leading-6 text-text-muted">
              {option.description}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

function getShippingMethodOptions(
  copy: (typeof checkoutCopy)[Language],
): CheckoutMethodOption<ShippingMethod>[] {
  return [
    {
      description: copy.shippingStandardDescription,
      label: copy.shippingStandardLabel,
      tone: "trust",
      value: "standard",
    },
    {
      description: copy.shippingExpressDescription,
      label: copy.shippingExpressLabel,
      tone: "arrival",
      value: "express",
    },
  ];
}

function getPaymentMethodOptions(
  copy: (typeof checkoutCopy)[Language],
  qrDemoPaymentsEnabled: boolean,
): CheckoutMethodOption<PaymentMethod>[] {
  const options: CheckoutMethodOption<PaymentMethod>[] = [
    {
      badge: copy.paymentPrimaryBadge,
      description: copy.paymentCodDescription,
      label: copy.paymentCodLabel,
      tone: "trust",
      value: "cod",
    },
    {
      badge: copy.paymentPrimaryBadge,
      description: copy.paymentBankDescription,
      label: copy.paymentBankLabel,
      tone: "offer",
      value: "bank-transfer",
    },
    {
      badge: copy.paymentWalletBadge,
      description: copy.paymentProviderDescription,
      label: copy.paymentZalopayLabel,
      tone: "operations",
      value: "zalopay",
    },
  ];

  if (qrDemoPaymentsEnabled) {
    options.push(
      {
        badge: copy.paymentGatewayBadge,
        description: copy.paymentMockQrDescription,
        label: copy.paymentMomoLabel,
        tone: "operations",
        value: "momo",
      },
      {
        badge: copy.paymentGatewayBadge,
        description: copy.paymentVietQrDescription,
        label: copy.paymentVietQrLabel,
        tone: "arrival",
        value: "vnpay",
      },
    );
  }

  return options;
}

function getCheckoutMethodToneClass(tone: CheckoutMethodTone) {
  const classes = {
    arrival: "border-arrival/25 hover:border-arrival",
    offer: "border-offer/25 hover:border-offer",
    operations: "border-operations/25 hover:border-operations",
    trust: "border-trust/25 hover:border-trust",
  } satisfies Record<CheckoutMethodTone, string>;

  return classes[tone];
}

function getCheckoutMethodBadgeClass(tone: CheckoutMethodTone) {
  const classes = {
    arrival: "border-arrival bg-arrival-muted text-arrival",
    offer: "border-offer bg-offer-muted text-offer",
    operations: "border-operations bg-operations-muted text-operations",
    trust: "border-trust bg-trust-muted text-trust",
  } satisfies Record<CheckoutMethodTone, string>;

  return classes[tone];
}

function CheckoutProfileRequirementPanel({
  copy,
  profileRequirement,
}: {
  copy: (typeof checkoutCopy)[Language];
  profileRequirement: CheckoutProfileRequirement;
}) {
  if (profileRequirement.blocksCheckout) {
    return (
      <div
        className="rounded-md border border-warning bg-warning/10 p-case-md text-small leading-6 text-warning"
        data-checkout-profile-guard
      >
        <h3 className="font-semibold">{copy.profileRequirementTitle}</h3>
        <p className="mt-case-xs">{copy.profileIncomplete}</p>
        <Link
          href="/account?next=/checkout"
          className="mt-case-sm inline-flex min-h-9 items-center justify-center rounded-md border border-warning bg-surface px-3 py-2 font-medium text-warning hover:bg-warning/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          data-checkout-profile-link
        >
          {copy.profileRequiredAction}
        </Link>
      </div>
    );
  }

  if (profileRequirement.state === "anonymous") {
    return null;
  }

  return (
    <div
      className="rounded-md border border-success bg-success/10 p-case-md text-small leading-6 text-success"
      data-checkout-profile-ready
    >
      {copy.profileComplete}
    </div>
  );
}

function getCheckoutProfileRequirement(
  customerAuthState: CustomerAuthState,
): CheckoutProfileRequirement {
  if (
    customerAuthState.status !== "authenticated" ||
    customerAuthState.user.role !== "customer"
  ) {
    return { blocksCheckout: false, missingFields: [], state: "anonymous" };
  }

  const blocksCheckout =
    !customerAuthState.user.profileCompleteness.isCompleteForCheckout;

  return {
    blocksCheckout,
    missingFields: customerAuthState.user.profileCompleteness.missingFields,
    state: blocksCheckout ? "blocked" : "ready",
  };
}

function getInitialCheckoutFormValues(
  customerAuthState: CustomerAuthState,
): CheckoutFormValues {
  if (customerAuthState.status !== "authenticated") {
    return initialCheckoutFormValues;
  }

  const address = customerAuthState.user.defaultShippingAddress;

  return {
    customerName:
      customerAuthState.user.fullName ?? customerAuthState.user.displayName,
    customerEmail: customerAuthState.user.email,
    customerPhone: customerAuthState.user.phone ?? address?.phone ?? "",
    shippingAddress: address ? formatShippingAddress(address) : "",
  };
}

function getCheckoutShippingAddress(
  customerAuthState: CustomerAuthState,
): ShippingAddress | null {
  if (customerAuthState.status !== "authenticated") {
    return null;
  }

  return customerAuthState.user.defaultShippingAddress;
}

function formatShippingAddress(address: ShippingAddress) {
  return [
    address.line1,
    address.line2,
    address.ward,
    address.district,
    address.province,
  ]
    .filter(Boolean)
    .join(", ");
}

function CheckoutCartReview({
  clearCart,
  copy,
  currencyRules,
  language,
  openCart,
  paymentMethod,
  estimatedPromotionDiscountVnd,
  reviewState,
  shippingMethod,
  totalQuantity,
}: {
  clearCart: () => void;
  copy: (typeof checkoutCopy)[Language];
  currencyRules: CurrencyDisplayRules;
  language: Language;
  openCart: () => void;
  paymentMethod: PaymentMethod;
  estimatedPromotionDiscountVnd: number;
  reviewState: CartReviewState;
  shippingMethod: ShippingMethod;
  totalQuantity: number;
}) {
  return (
    <aside className="flex flex-col gap-case-md" data-checkout-cart-review>
      <div className="flex items-start justify-between gap-case-md">
        <div className="min-w-0">
          <h2 className="text-heading-2 font-semibold text-foreground">
            {copy.stepCart}
          </h2>
          <p className="mt-case-xs text-small text-text-muted">
            {totalQuantity} {totalQuantity === 1 ? copy.item : copy.items}
          </p>
        </div>
        <Badge
          variant={
            reviewState.status === "success"
              ? "success"
              : reviewState.status === "error"
                ? "error"
                : "neutral"
          }
        >
          {reviewState.status === "success"
            ? copy.cartChecked
            : reviewState.status === "error"
              ? copy.cartNeedsFix
              : copy.cartChecking}
        </Badge>
      </div>

      {reviewState.status === "loading" || reviewState.status === "idle" ? (
        <div className="flex flex-col gap-case-sm" data-checkout-review-loading>
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-14" />
        </div>
      ) : null}

      {reviewState.status === "error" ? (
        <div
          className="rounded-lg border border-border bg-surface p-case-lg"
          data-checkout-validation-error={reviewState.code}
        >
          <ErrorMessage>{reviewState.message}</ErrorMessage>
          <div className="mt-case-md grid gap-case-sm sm:grid-cols-2 lg:grid-cols-1">
            <Button type="button" variant="secondary" onClick={openCart}>
              {copy.openCart}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={clearCart}
              data-checkout-clear-cart
            >
              {copy.clearCart}
            </Button>
          </div>
        </div>
      ) : null}

      {reviewState.status === "success" ? (
        <>
          <ul className="flex flex-col gap-case-sm">
            {reviewState.data.items.map((line) => {
              const category = line.category;

              return (
                <li
                  key={line.productId}
                  className="rounded-lg border border-border bg-surface p-case-md"
                  data-checkout-line-item={line.productId}
                >
                  <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-case-md">
                    <div className="aspect-[3/4] overflow-hidden rounded-md border border-border bg-surface-muted p-1">
                      <Image
                        src={line.product.coverPath}
                        alt={line.product.coverAlt}
                        width={64}
                        height={86}
                        className="h-full w-full rounded-sm object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/products/${line.product.slug}`}
                        className="block truncate font-semibold text-foreground hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {line.product.name}
                      </Link>
                      {line.product.authors.length > 0 ? (
                        <p className="mt-case-xs truncate text-small text-text-muted">
                          {line.product.authors.join(", ")}
                        </p>
                      ) : null}
                      <div className="mt-case-sm flex flex-wrap gap-case-xs">
                        {category ? (
                          <Badge variant="neutral" size="sm">
                            {getCartCategoryName(category, language)}
                          </Badge>
                        ) : null}
                        <Badge variant="neutral" size="sm">
                          {getEditionLanguageLabel(
                            line.product.language,
                            language,
                          )}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {getFormatLabel(line.product.format, language)}
                        </Badge>
                        <Badge variant="success" size="sm">
                          {copy.availableLeft(line.availableStock)}
                        </Badge>
                      </div>
                      <div className="mt-case-sm flex flex-wrap items-center justify-between gap-case-sm text-small">
                        <p className="text-text-muted">
                          {line.quantity} x {formatVnd(line.unitPrice)}
                        </p>
                        <p className="font-semibold text-foreground">
                          {formatVnd(line.lineTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <CheckoutOrderSummary
            copy={copy}
            currencyRules={currencyRules}
            data={reviewState.data}
            discountTotalVnd={estimatedPromotionDiscountVnd}
            language={language}
            paymentMethod={paymentMethod}
            shippingMethod={shippingMethod}
          />
        </>
      ) : null}
    </aside>
  );
}

function CheckoutOrderSummary({
  copy,
  currencyRules,
  data,
  discountTotalVnd,
  language,
  paymentMethod,
  shippingMethod,
}: {
  copy: (typeof checkoutCopy)[Language];
  currencyRules: CurrencyDisplayRules;
  data: CartValidationData;
  discountTotalVnd: number;
  language: Language;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface p-case-lg"
      aria-labelledby="checkout-order-summary-title"
      data-checkout-order-summary
    >
      <div className="flex items-start justify-between gap-case-md">
        <div className="min-w-0">
          <h3
            id="checkout-order-summary-title"
            className="text-heading-3 font-semibold text-foreground"
          >
            {copy.orderSummary}
          </h3>
          <p className="mt-case-xs text-small text-text-muted">
            {copy.orderSummaryDescription}
          </p>
        </div>
        <Badge variant="success" size="sm">
          {copy.cartChecked}
        </Badge>
      </div>

      <CheckoutTotalsBreakdown
        copy={copy}
        currencyRules={currencyRules}
        data={data}
        discountTotalVnd={discountTotalVnd}
        language={language}
        paymentMethod={paymentMethod}
        shippingMethod={shippingMethod}
        totalDataAttribute="data-checkout-summary-total"
      />

      <p className="mt-case-md border-t border-border pt-case-md text-small leading-6 text-text-muted">
        {copy.orderSummaryNext}
      </p>
    </section>
  );
}

function CheckoutTotalsBreakdown({
  copy,
  currencyRules,
  data,
  discountTotalVnd,
  language,
  paymentMethod,
  shippingMethod,
  totalDataAttribute,
}: {
  copy: (typeof checkoutCopy)[Language];
  currencyRules: CurrencyDisplayRules;
  data: CartValidationData;
  discountTotalVnd?: number;
  language: Language;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  totalDataAttribute:
    | "data-checkout-final-total"
    | "data-checkout-summary-total";
}) {
  const itemCount = getValidatedItemCount(data);
  const totals = calculateBookCheckoutTotals({
    currencyRules,
    discountTotalVnd,
    includeDisplayEstimate: language === "en",
    paymentMethod,
    shippingMethod,
    subtotalVnd: data.subtotal,
  });
  const totalDataAttributes =
    totalDataAttribute === "data-checkout-final-total"
      ? { "data-checkout-final-total": true }
      : { "data-checkout-summary-total": true };

  return (
    <dl className="mt-case-md flex flex-col divide-y divide-border">
      <div className="flex items-center justify-between gap-case-md pb-case-sm">
        <dt className="text-small text-text-muted">{copy.items}</dt>
        <dd
          className="text-small font-medium text-foreground"
          data-checkout-summary-items
        >
          {itemCount} {itemCount === 1 ? copy.item : copy.items}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-case-md py-case-sm">
        <dt className="text-small text-text-muted">{copy.subtotal}</dt>
        <dd
          className="text-small font-medium text-foreground"
          data-checkout-subtotal
          data-checkout-summary-subtotal
        >
          {formatVnd(totals.subtotalVnd)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-case-md py-case-sm">
        <dt className="text-small text-text-muted">{copy.shippingLabel}</dt>
        <dd
          className="text-small font-medium text-foreground"
          data-checkout-summary-shipping
        >
          {formatVnd(totals.shippingFeeVnd)}
        </dd>
      </div>
      {totals.discountTotalVnd > 0 ? (
        <div className="flex items-center justify-between gap-case-md py-case-sm">
          <dt className="text-small text-text-muted">
            {copy.promotionDiscount}
          </dt>
          <dd
            className="text-small font-medium text-success"
            data-checkout-summary-discount
          >
            -{formatVnd(totals.discountTotalVnd)}
          </dd>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-case-md py-case-sm">
        <dt className="text-small text-text-muted">{copy.vatEstimate}</dt>
        <dd
          className="text-small font-medium text-foreground"
          data-checkout-summary-tax
        >
          {formatVnd(totals.taxTotalVnd)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-case-md py-case-sm">
        <dt className="text-small text-text-muted">{copy.paymentFee}</dt>
        <dd
          className="text-small font-medium text-foreground"
          data-checkout-summary-payment
        >
          {formatVnd(totals.paymentFeeVnd)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-case-md pt-case-md">
        <dt className="font-semibold text-foreground">{copy.orderTotal}</dt>
        <dd
          className="text-heading-3 font-semibold text-foreground"
          {...totalDataAttributes}
        >
          {formatVnd(totals.totalVnd)}
        </dd>
      </div>
      {totals.displayEstimate ? (
        <div className="grid gap-case-xs py-case-md">
          <div className="flex items-center justify-between gap-case-md">
            <dt className="text-small text-text-muted">{copy.usdEstimate}</dt>
            <dd
              className="text-small font-semibold text-foreground"
              data-checkout-usd-estimate
            >
              {formatUsd(totals.displayEstimate.approximateAmountUsd)}
            </dd>
          </div>
          <dd className="text-small leading-6 text-text-muted">
            {copy.usdEstimateSource}: {currencyRules.sourceLabel},{" "}
            {formatVnd(currencyRules.exchangeRateVndPerUsd)}/USD,{" "}
            {formatDisplayTimestamp(currencyRules.quotedAt)}.{" "}
            {copy.usdEstimateFee}:{" "}
            {formatBasisPoints(
              currencyRules.internationalPaymentFeeBasisPoints,
            )}
            . {copy.vndAuthoritative}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function formatDisplayTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Asia/Ho_Chi_Minh",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

function getVoucherDiscountLabel(
  voucher: CustomerSignupVoucher,
  language: Language,
) {
  if (voucher.discountType === "fixed-vnd") {
    return formatVnd(voucher.amountVnd ?? 0);
  }

  return language === "vi"
    ? `Giảm ${((voucher.percentageBasisPoints ?? 0) / 100).toLocaleString("vi-VN")}%`
    : `${((voucher.percentageBasisPoints ?? 0) / 100).toLocaleString("en-US")}% off`;
}

function getSelectedSignupVoucherDiscountVnd({
  promotionCode,
  subtotalVnd,
  vouchers,
}: {
  promotionCode: string;
  subtotalVnd: number;
  vouchers: CustomerSignupVoucher[];
}) {
  const normalizedCode = promotionCode.trim().toUpperCase();
  const voucher = vouchers.find(
    (item) => item.code === normalizedCode && item.status === "available",
  );

  if (!voucher || subtotalVnd <= 0) {
    return 0;
  }

  if (voucher.discountType === "fixed-vnd") {
    return Math.min(voucher.amountVnd ?? 0, subtotalVnd);
  }

  return Math.min(
    Math.round((subtotalVnd * (voucher.percentageBasisPoints ?? 0)) / 10_000),
    subtotalVnd,
  );
}

function getCheckoutVoucherStatusLabel(
  status: CustomerSignupVoucher["status"],
  copy: (typeof checkoutCopy)[Language],
) {
  if (status === "used") return copy.promotionVoucherUsed;
  if (status === "expired") return copy.promotionVoucherExpired;
  return copy.promotionVoucherReserved;
}

function getCheckoutVoucherBadgeVariant(status: CustomerSignupVoucher["status"]) {
  if (status === "reserved") return "warning";
  if (status === "used") return "neutral";
  return "error";
}

function formatCheckoutVoucherDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getFormatLabel(format: BookFormat, language: Language) {
  const labels: Record<Language, Record<BookFormat, string>> = {
    en: {
      "box-set": "Box set",
      hardcover: "Hardcover",
      paperback: "Paperback",
      "special-edition": "Special edition",
    },
    vi: {
      "box-set": "Bộ sách",
      hardcover: "Bìa cứng",
      paperback: "Bìa mềm",
      "special-edition": "Ấn bản đặc biệt",
    },
  };

  return labels[language][format];
}

function getCartCategoryName(
  category: CartValidationData["items"][number]["category"],
  language: Language,
) {
  if (!category) {
    return "";
  }

  return pickLocalizedText(category.labels, language, category.name);
}
