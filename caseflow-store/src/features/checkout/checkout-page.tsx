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
import type { ValidatedCartData } from "@/types/catalog";
import type {
  BookFormat,
  CartItem,
  Order,
  OrderItem,
  PaymentMethod,
  ShippingAddress,
  ShippingMethod,
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
  description: string;
  label: string;
  value: TValue;
};

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
    contactAndShipping: "Contact and shipping",
    contactConfirmation: "Customer/contact confirmation",
    contactConfirmationDescription:
      "Order contact details come from your customer account.",
    creatingOrder: "Creating order",
    customerDetailsValid:
      "Customer details are valid for the next checkout step.",
    description:
      "Review the cart against current stock, confirm shipping details, and place an order without payment card fields.",
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
    noCardFields: "No card number, expiry date, or CVV is collected.",
    openCart: "Open cart",
    orderCouldNotBeCreated:
      "Order could not be created. Review the cart and try again.",
    orderServiceUnavailable:
      "Order service is unavailable. Try again before ordering.",
    orderSummary: "Order summary",
    orderSummaryDescription:
      "Totals are recalculated after cart validation.",
    orderSummaryNext:
      "These totals are recalculated again on the server before the order is created.",
    orderTotal: "Order total",
    payment: "Payment",
    paymentBankDescription: "Transfer details can be confirmed after order creation.",
    paymentBankLabel: "Bank transfer",
    paymentCodDescription: "Pay when the bookstore delivery is completed.",
    paymentCodLabel: "Cash on delivery",
    paymentMethodTitle: "Payment method",
    paymentLabel: "No payment collected",
    paymentMomoLabel: "MoMo",
    paymentProviderDescription:
      "Provider confirmation is represented without collecting wallet credentials.",
    paymentVnpayLabel: "VNPay",
    paymentZalopayLabel: "ZaloPay",
    paymentFee: "Payment fee",
    phoneError: "Enter your phone number.",
    phoneHint: "Digits, spaces, +, -, parentheses, and dots are accepted.",
    phoneInvalid: "Enter a phone number using 7-24 digits and phone symbols.",
    phoneLabel: "Phone",
    placeOrder: "Place order",
    promotionCode: "Promotion code",
    promotionDiscount: "Promotion discount",
    promotionHint: "Optional",
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
    shippingExpressDescription: "Faster delivery estimate for Vietnam addresses.",
    shippingExpressLabel: "Express delivery",
    shippingLabel: "Shipping estimate",
    shippingMethodTitle: "Shipping method",
    shippingStandardDescription:
      "Best for most local bookstore deliveries.",
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
    usdEstimateFee: "Display-only international payment fee",
    usdEstimateSource: "Rate source",
    vndAuthoritative: "VND remains the checkout currency.",
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
    contactAndShipping: "Thông tin liên hệ và giao hàng",
    contactConfirmation: "Xác nhận khách hàng/liên hệ",
    contactConfirmationDescription:
      "Thông tin liên hệ đơn hàng lấy từ tài khoản khách hàng.",
    creatingOrder: "Đang tạo đơn",
    customerDetailsValid:
      "Thông tin khách hàng hợp lệ cho bước thanh toán tiếp theo.",
    description:
      "Kiểm tra giỏ hàng theo tồn kho hiện tại, xác nhận thông tin giao hàng và đặt đơn mà không cần trường thẻ thanh toán.",
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
    noCardFields: "Không thu số thẻ, ngày hết hạn hoặc CVV.",
    openCart: "Mở giỏ hàng",
    orderCouldNotBeCreated:
      "Không thể tạo đơn hàng. Hãy kiểm tra giỏ hàng rồi thử lại.",
    orderServiceUnavailable:
      "Dịch vụ đơn hàng chưa khả dụng. Vui lòng thử lại trước khi đặt.",
    orderSummary: "Tóm tắt đơn hàng",
    orderSummaryDescription:
      "Tổng tiền được tính lại sau khi kiểm tra giỏ hàng.",
    orderSummaryNext:
      "Các khoản này sẽ được server tính lại lần nữa trước khi tạo đơn.",
    orderTotal: "Tổng đơn hàng",
    payment: "Thanh toán",
    paymentBankDescription: "Thông tin chuyển khoản có thể xác nhận sau khi tạo đơn.",
    paymentBankLabel: "Chuyển khoản",
    paymentCodDescription: "Thanh toán khi nhận hàng từ nhà sách.",
    paymentCodLabel: "COD",
    paymentMethodTitle: "Phương thức thanh toán",
    paymentLabel: "Không thu tiền",
    paymentMomoLabel: "MoMo",
    paymentProviderDescription:
      "Trạng thái nhà cung cấp được thể hiện mà không thu thông tin ví.",
    paymentVnpayLabel: "VNPay",
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
    promotionHint: "Không bắt buộc",
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
    shippingExpressDescription: "Ước tính giao nhanh cho địa chỉ tại Việt Nam.",
    shippingExpressLabel: "Giao nhanh",
    shippingLabel: "Phí giao hàng ước tính",
    shippingMethodTitle: "Phương thức giao hàng",
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
    usdEstimateFee: "Phí thanh toán quốc tế chỉ để tham khảo",
    usdEstimateSource: "Nguồn tỷ giá",
    vndAuthoritative: "VND vẫn là tiền tệ thanh toán.",
    vatEstimate: "VAT ước tính",
  },
} as const;

export function CheckoutPage({
  currencyRules,
  customerAuthState,
  language,
}: {
  currencyRules: CurrencyDisplayRules;
  customerAuthState: CustomerAuthState;
  language: Language;
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
              promotionCode={promotionCode}
              reviewState={reviewState}
              setPaymentMethod={setPaymentMethod}
              setPromotionCode={setPromotionCode}
              setShippingMethod={setShippingMethod}
              shippingMethod={shippingMethod}
            />
            <CheckoutCartReview
              clearCart={clearCart}
              copy={copy}
              currencyRules={currencyRules}
              language={language}
              openCart={openCart}
              paymentMethod={paymentMethod}
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

function CheckoutDetailsForm({
  clearCart,
  copy,
  currencyRules,
  customerAuthState,
  items,
  language,
  paymentMethod,
  promotionCode,
  reviewState,
  setPaymentMethod,
  setPromotionCode,
  setShippingMethod,
  shippingMethod,
}: {
  clearCart: () => void;
  copy: (typeof checkoutCopy)[Language];
  currencyRules: CurrencyDisplayRules;
  customerAuthState: CustomerAuthState;
  items: CartItem[];
  language: Language;
  paymentMethod: PaymentMethod;
  promotionCode: string;
  reviewState: CartReviewState;
  setPaymentMethod: (paymentMethod: PaymentMethod) => void;
  setPromotionCode: (promotionCode: string) => void;
  setShippingMethod: (shippingMethod: ShippingMethod) => void;
  shippingMethod: ShippingMethod;
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
            options={getPaymentMethodOptions(copy)}
            value={paymentMethod}
          />
        </CheckoutStep>

        <CheckoutStep title={copy.promotionCode}>
          <Input
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
          className="flex min-w-0 cursor-pointer gap-case-sm rounded-md border border-border bg-surface p-case-md transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
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
            <span className="block font-medium text-foreground">
              {option.label}
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
      value: "standard",
    },
    {
      description: copy.shippingExpressDescription,
      label: copy.shippingExpressLabel,
      value: "express",
    },
  ];
}

function getPaymentMethodOptions(
  copy: (typeof checkoutCopy)[Language],
): CheckoutMethodOption<PaymentMethod>[] {
  return [
    {
      description: copy.paymentCodDescription,
      label: copy.paymentCodLabel,
      value: "cod",
    },
    {
      description: copy.paymentBankDescription,
      label: copy.paymentBankLabel,
      value: "bank-transfer",
    },
    {
      description: copy.paymentProviderDescription,
      label: copy.paymentMomoLabel,
      value: "momo",
    },
    {
      description: copy.paymentProviderDescription,
      label: copy.paymentZalopayLabel,
      value: "zalopay",
    },
    {
      description: copy.paymentProviderDescription,
      label: copy.paymentVnpayLabel,
      value: "vnpay",
    },
  ];
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
  language,
  paymentMethod,
  shippingMethod,
}: {
  copy: (typeof checkoutCopy)[Language];
  currencyRules: CurrencyDisplayRules;
  data: CartValidationData;
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
  language,
  paymentMethod,
  shippingMethod,
  totalDataAttribute,
}: {
  copy: (typeof checkoutCopy)[Language];
  currencyRules: CurrencyDisplayRules;
  data: CartValidationData;
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
