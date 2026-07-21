"use client";

import Link from "next/link";
import * as React from "react";

import { Badge, Button, Container, ErrorMessage, Input } from "@/components/ui";
import { formatVnd } from "@/lib/format/currency";
import type {
  CustomerAuthIdentity,
  CustomerAuthState,
} from "@/lib/auth/customer";
import type { Language } from "@/lib/i18n/language";
import type { CustomerSignupVoucher } from "@/types/domain";

import { CustomerProfileForm } from "./customer-profile-form";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
};

type CustomerSessionData = CustomerAuthIdentity & {
  verification:
    | "email-confirmation-required"
    | "email-unverified"
    | "email-verified"
    | "session-active";
};

type AuthMode = "sign-in" | "sign-up";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string; verification: CustomerSessionData["verification"] }
  | { status: "error"; message: string };

type FieldErrors = Partial<{
  confirmPassword: string;
  email: string;
  fullName: string;
  password: string;
}>;

const customerAuthCopy = {
  en: {
    accountBadge: "Customer account",
    accountStatus: "Account status",
    alreadySignedIn: "Signed in",
    authUnavailable: "Account status is temporarily unavailable.",
    backToStorefront: "Back to bookstore",
    checkoutReady: "Continue",
    confirmPassword: "Confirm password",
    confirmPasswordError: "Passwords must match.",
    createAccount: "Create account",
    createAccountIntro:
      "Create a CaseFlow Books account before checkout and receive 3 welcome discount codes for your first orders.",
    creatingAccount: "Creating account",
    email: "Email address",
    emailError: "Enter a valid email address.",
    emailNotVerified:
      "Email is not confirmed yet. You can still see the account state here, but checkout may ask you to confirm contact details later.",
    emailNotVerifiedBadge: "Email not confirmed",
    emailVerified: "Email confirmed",
    fullName: "Full name",
    fullNameError: "Enter your full name.",
    intro:
      "Browse freely, keep your cart on this device, and sign in when you are ready to checkout.",
    login: "Sign in",
    loginIntro:
      "Use the customer account tied to your order email and delivery profile.",
    loggingIn: "Signing in",
    logout: "Sign out",
    logoutFailed: "Could not sign out. Try again before continuing.",
    noPhoneVerification:
      "Phone and shipping details are completed in the customer profile before checkout.",
    openingAccount: "Signed in. Opening your account.",
    orderHistory: "Order history",
    password: "Password",
    passwordError: "Password must be at least 8 characters.",
    role: "Role",
    signedOut: "Signed out",
    signInTab: "Sign in",
    signUpTab: "Create account",
    submitFailed: "Customer authentication failed.",
    title: "Your CaseFlow Books account",
    registerForCodes: "Register for welcome codes",
    verificationRequired:
      "Account created. Check your email if confirmation is requested, then return to sign in.",
    viewAdmin: "Open admin workspace",
    voucherAvailable: "Ready to use",
    voucherExpired: "Expired",
    voucherPanelDescription:
      "Choose one welcome code per order. Codes are account-bound and stay valid for 30 days after activation.",
    voucherPanelTitle: "Your welcome discount codes",
    voucherPromoDescription:
      "Create a customer account to receive 3 account-bound discount codes. Use one code per checkout and track every order from your profile.",
    voucherPromoTitle: "Register now to receive discount codes",
    voucherReserved: "Reserved",
    voucherUsed: "Used",
    voucherValidUntil: "Valid until",
  },
  vi: {
    accountBadge: "Tài khoản khách hàng",
    accountStatus: "Trạng thái tài khoản",
    alreadySignedIn: "Đã đăng nhập",
    authUnavailable: "Tạm thời chưa đọc được trạng thái tài khoản.",
    backToStorefront: "Quay lại nhà sách",
    checkoutReady: "Tiếp tục",
    confirmPassword: "Nhập lại mật khẩu",
    confirmPasswordError: "Mật khẩu nhập lại chưa khớp.",
    createAccount: "Tạo tài khoản",
    createAccountIntro:
      "Tạo tài khoản CaseFlow Books trước khi thanh toán và nhận 3 mã giảm giá chào mừng cho các đơn đầu tiên.",
    creatingAccount: "Đang tạo tài khoản",
    email: "Địa chỉ email",
    emailError: "Nhập địa chỉ email hợp lệ.",
    emailNotVerified:
      "Email chưa được xác nhận. Bạn vẫn có thể xem trạng thái tài khoản tại đây, nhưng bước thanh toán có thể yêu cầu xác nhận thông tin liên hệ sau.",
    emailNotVerifiedBadge: "Email chưa xác nhận",
    emailVerified: "Email đã xác nhận",
    fullName: "Họ và tên",
    fullNameError: "Nhập họ và tên.",
    intro:
      "Bạn có thể xem sách và thêm vào giỏ tự do, rồi đăng nhập khi sẵn sàng thanh toán.",
    login: "Đăng nhập",
    loginIntro:
      "Dùng tài khoản khách hàng gắn với email đặt hàng và hồ sơ giao hàng.",
    loggingIn: "Đang đăng nhập",
    logout: "Đăng xuất",
    logoutFailed: "Chưa thể đăng xuất. Vui lòng thử lại trước khi tiếp tục.",
    noPhoneVerification:
      "Số điện thoại và địa chỉ giao hàng được hoàn tất trong hồ sơ khách hàng trước khi thanh toán.",
    openingAccount: "Đã đăng nhập. Đang mở tài khoản.",
    orderHistory: "Lịch sử đơn hàng",
    password: "Mật khẩu",
    passwordError: "Mật khẩu phải có ít nhất 8 ký tự.",
    role: "Vai trò",
    signedOut: "Chưa đăng nhập",
    signInTab: "Đăng nhập",
    signUpTab: "Tạo tài khoản",
    submitFailed: "Xác thực khách hàng thất bại.",
    title: "Tài khoản CaseFlow Books của bạn",
    registerForCodes: "Đăng ký nhận mã",
    verificationRequired:
      "Đã tạo tài khoản. Hãy kiểm tra email nếu hệ thống yêu cầu xác nhận, sau đó quay lại đăng nhập.",
    viewAdmin: "Mở khu vực quản trị",
    voucherAvailable: "Có thể dùng",
    voucherExpired: "Hết hạn",
    voucherPanelDescription:
      "Mỗi đơn chỉ dùng một mã chào mừng. Mã gắn với tài khoản và có hiệu lực 30 ngày sau khi kích hoạt.",
    voucherPanelTitle: "Mã giảm giá chào mừng của bạn",
    voucherPromoDescription:
      "Tạo tài khoản khách hàng để nhận 3 mã giảm giá riêng cho tài khoản. Mỗi lần thanh toán dùng một mã và theo dõi đơn ngay trong hồ sơ.",
    voucherPromoTitle: "Đăng ký ngay để nhận mã giảm giá",
    voucherReserved: "Đang giữ",
    voucherUsed: "Đã dùng",
    voucherValidUntil: "Hạn dùng",
  },
} as const;

export function CustomerAuthPage({
  authState,
  language,
  nextPath,
  signupVouchers,
}: {
  authState: CustomerAuthState;
  language: Language;
  nextPath: string | null;
  signupVouchers: CustomerSignupVoucher[];
}) {
  const copy = customerAuthCopy[language];
  const [mode, setMode] = React.useState<AuthMode>("sign-in");
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitState, setSubmitState] = React.useState<SubmitState>({
    status: "idle",
  });

  async function handleLogout() {
    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/customer/session", {
        method: "DELETE",
      });
      const payload = (await response.json()) as ApiResponse<{
        signedOut: boolean;
      }>;

      if (!response.ok || payload.error) {
        setSubmitState({
          status: "error",
          message: payload.error?.message ?? copy.logoutFailed,
        });
        return;
      }

      window.location.replace("/account");
    } catch {
      setSubmitState({ status: "error", message: copy.logoutFailed });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    const normalizedFullName = fullName.trim();
    const nextErrors: FieldErrors = {};

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      nextErrors.email = copy.emailError;
    }

    if (password.length < 8) {
      nextErrors.password = copy.passwordError;
    }

    if (mode === "sign-up") {
      if (!normalizedFullName) {
        nextErrors.fullName = copy.fullNameError;
      }

      if (password !== confirmPassword) {
        nextErrors.confirmPassword = copy.confirmPasswordError;
      }
    }

    setEmail(normalizedEmail);
    setFullName(normalizedFullName);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitState({ status: "idle" });
      return;
    }

    setSubmitState({ status: "submitting" });

    try {
      const response = await fetch("/api/customer/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "sign-up"
            ? {
                intent: "sign-up",
                fullName: normalizedFullName,
                email: normalizedEmail,
                password,
              }
            : {
                intent: "sign-in",
                email: normalizedEmail,
                password,
              },
        ),
      });
      const payload = (await response.json()) as ApiResponse<CustomerSessionData>;

      setPassword("");
      setConfirmPassword("");

      if (!response.ok || payload.error || !payload.data) {
        setSubmitState({
          status: "error",
          message: payload.error?.message ?? copy.submitFailed,
        });
        return;
      }

      if (payload.data.verification === "email-confirmation-required") {
        setSubmitState({
          status: "success",
          message: copy.verificationRequired,
          verification: payload.data.verification,
        });
        return;
      }

      setSubmitState({
        status: "success",
        message: copy.openingAccount,
        verification: payload.data.verification,
      });
      window.location.replace(nextPath ?? "/account");
    } catch {
      setSubmitState({ status: "error", message: copy.submitFailed });
    }
  }

  return (
    <main className="bg-background py-case-2xl text-foreground" data-customer-auth-page>
      <Container className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
        <section className="flex min-w-0 flex-col gap-case-lg">
          <Link
            href="/"
            className="w-fit text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.backToStorefront}
          </Link>

          <div className="flex max-w-3xl flex-col gap-case-sm">
            <Badge variant="primary">{copy.accountBadge}</Badge>
            <h1 className="text-heading-1 font-semibold text-foreground">
              {copy.title}
            </h1>
            <p className="text-body leading-7 text-text-muted">{copy.intro}</p>
          </div>

          <div
            className="rounded-lg border border-trust/25 bg-trust-muted p-case-lg"
            data-customer-auth-guidance
          >
            <h2 className="text-heading-3 font-semibold text-foreground">
              {copy.accountStatus}
            </h2>
            <p className="mt-case-sm text-small leading-6 text-text-muted">
              {copy.noPhoneVerification}
            </p>
          </div>

          {authState.status !== "authenticated" ? (
            <div
              className="case-retail-red-band rounded-lg border border-primary/20 p-case-lg"
              data-customer-signup-voucher-promo
            >
              <Badge variant="primary">{copy.registerForCodes}</Badge>
              <h2 className="mt-case-sm text-heading-3 font-semibold text-foreground">
                {copy.voucherPromoTitle}
              </h2>
              <p className="mt-case-sm text-small leading-6 text-text-muted">
                {copy.voucherPromoDescription}
              </p>
              <Button
                className="mt-case-md"
                type="button"
                onClick={() => {
                  setMode("sign-up");
                  setSubmitState({ status: "idle" });
                  setFieldErrors({});
                }}
                data-customer-signup-voucher-cta
              >
                {copy.registerForCodes}
              </Button>
            </div>
          ) : null}
        </section>

        {authState.status === "authenticated" ? (
          <SignedInPanel
            copy={copy}
            isSubmitting={submitState.status === "submitting"}
            language={language}
            nextPath={nextPath}
            onLogout={handleLogout}
            signupVouchers={signupVouchers}
            submitState={submitState}
            user={authState.user}
          />
        ) : (
          <section
            className="rounded-lg border border-operations/25 bg-surface p-case-lg"
            data-customer-auth-panel
          >
            {authState.status === "error" ? (
              <div className="mb-case-md" data-customer-auth-state-error>
                <ErrorMessage>
                  {authState.message || copy.authUnavailable}
                </ErrorMessage>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-case-sm" role="tablist">
              <Button
                type="button"
                variant={mode === "sign-in" ? "primary" : "secondary"}
                onClick={() => {
                  setMode("sign-in");
                  setSubmitState({ status: "idle" });
                  setFieldErrors({});
                }}
                data-customer-auth-mode="sign-in"
              >
                {copy.signInTab}
              </Button>
              <Button
                type="button"
                variant={mode === "sign-up" ? "primary" : "secondary"}
                onClick={() => {
                  setMode("sign-up");
                  setSubmitState({ status: "idle" });
                  setFieldErrors({});
                }}
                data-customer-auth-mode="sign-up"
              >
                {copy.signUpTab}
              </Button>
            </div>

            <div className="mt-case-lg">
              <h2 className="text-heading-2 font-semibold text-foreground">
                {mode === "sign-in" ? copy.login : copy.createAccount}
              </h2>
              <p className="mt-case-xs text-small leading-6 text-text-muted">
                {mode === "sign-in" ? copy.loginIntro : copy.createAccountIntro}
              </p>
            </div>

            <form
              className="mt-case-lg flex flex-col gap-case-md"
              onSubmit={handleSubmit}
              noValidate
              data-customer-auth-form
            >
              {mode === "sign-up" ? (
                <Input
                  id="customer-full-name"
                  label={copy.fullName}
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.currentTarget.value);
                    setFieldErrors((current) => ({
                      ...current,
                      fullName: undefined,
                    }));
                  }}
                  error={fieldErrors.fullName}
                  data-customer-auth-full-name
                />
              ) : null}

              <Input
                id="customer-email"
                label={copy.email}
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.currentTarget.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                error={fieldErrors.email}
                data-customer-auth-email
              />

              <Input
                id="customer-password"
                label={copy.password}
                name="password"
                type="password"
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(event.currentTarget.value);
                  setFieldErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }}
                error={fieldErrors.password}
                data-customer-auth-password
              />

              {mode === "sign-up" ? (
                <Input
                  id="customer-confirm-password"
                  label={copy.confirmPassword}
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.currentTarget.value);
                    setFieldErrors((current) => ({
                      ...current,
                      confirmPassword: undefined,
                    }));
                  }}
                  error={fieldErrors.confirmPassword}
                  data-customer-auth-confirm-password
                />
              ) : null}

              <SubmitFeedback submitState={submitState} />

              <Button
                type="submit"
                size="lg"
                isLoading={submitState.status === "submitting"}
                data-customer-auth-submit
              >
                {submitState.status === "submitting"
                  ? mode === "sign-in"
                    ? copy.loggingIn
                    : copy.creatingAccount
                  : mode === "sign-in"
                    ? copy.login
                    : copy.createAccount}
              </Button>
            </form>
          </section>
        )}
      </Container>
    </main>
  );
}

function SignedInPanel({
  copy,
  isSubmitting,
  language,
  nextPath,
  onLogout,
  signupVouchers,
  submitState,
  user,
}: {
  copy: (typeof customerAuthCopy)[Language];
  isSubmitting: boolean;
  language: Language;
  nextPath: string | null;
  onLogout: () => void;
  signupVouchers: CustomerSignupVoucher[];
  submitState: SubmitState;
  user: CustomerAuthIdentity;
}) {
  const [currentUser, setCurrentUser] = React.useState(user);

  return (
    <section
      className="rounded-lg border border-trust/25 bg-trust-muted p-case-lg"
      data-customer-account-panel
      data-customer-auth-state="signed-in"
    >
      <div className="flex items-start justify-between gap-case-md">
        <div className="min-w-0">
          <h2 className="text-heading-2 font-semibold text-foreground">
            {copy.alreadySignedIn}
          </h2>
          <p className="mt-case-xs break-words text-small leading-6 text-text-muted">
            {currentUser.email}
          </p>
        </div>
        <Badge variant={currentUser.emailVerified ? "success" : "warning"}>
          {currentUser.emailVerified
            ? copy.emailVerified
            : copy.emailNotVerifiedBadge}
        </Badge>
      </div>

      <dl className="mt-case-lg grid gap-case-sm sm:grid-cols-2">
        <AccountMetric
          label={copy.accountStatus}
          value={currentUser.displayName}
        />
        <AccountMetric label={copy.role} value={currentUser.role} />
      </dl>

      {!currentUser.emailVerified ? (
        <p
          className="mt-case-md rounded-md border border-warning bg-warning/10 p-case-md text-small leading-6 text-warning"
          data-customer-email-unverified
        >
          {copy.emailNotVerified}
        </p>
      ) : null}

      {currentUser.role === "customer" ? (
        <SignupVoucherPanel
          copy={copy}
          language={language}
          vouchers={signupVouchers}
        />
      ) : null}

      <SubmitFeedback submitState={submitState} />

      <div className="mt-case-lg flex flex-wrap gap-case-sm">
        {nextPath && currentUser.role === "customer" ? (
          <Link
            href={nextPath}
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-body font-medium text-surface hover:border-primary-hover hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-customer-next-link
          >
            {copy.checkoutReady}
          </Link>
        ) : null}
        {currentUser.role === "customer" ? (
          <Link
            href="/account/orders"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-body font-medium text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            data-customer-orders-link
          >
            {copy.orderHistory}
          </Link>
        ) : null}
        {currentUser.role === "admin" || currentUser.role === "staff" ? (
          <Link
            href="/admin/orders"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-surface px-5 py-3 text-body font-medium text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.viewAdmin}
          </Link>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="lg"
          isLoading={isSubmitting}
          onClick={onLogout}
          data-customer-logout
        >
          {copy.logout}
        </Button>
      </div>

      {currentUser.role === "customer" ? (
        <CustomerProfileForm
          language={language}
          onProfileSaved={setCurrentUser}
          user={currentUser}
        />
      ) : null}
    </section>
  );
}

function SubmitFeedback({ submitState }: { submitState: SubmitState }) {
  if (submitState.status === "error") {
    return (
      <div className="mt-case-md" data-customer-auth-error>
        <ErrorMessage>{submitState.message}</ErrorMessage>
      </div>
    );
  }

  if (submitState.status === "success") {
    return (
      <div
        role="status"
        className="mt-case-md rounded-md border border-success bg-success/10 p-case-md text-small leading-6 text-success"
        data-customer-auth-success
        data-customer-auth-verification={submitState.verification}
      >
        {submitState.message}
      </div>
    );
  }

  return null;
}

function AccountMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-muted p-case-md">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-case-xs break-words font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function SignupVoucherPanel({
  copy,
  language,
  vouchers,
}: {
  copy: (typeof customerAuthCopy)[Language];
  language: Language;
  vouchers: CustomerSignupVoucher[];
}) {
  if (vouchers.length === 0) {
    return null;
  }

  return (
    <section
      className="mt-case-lg rounded-lg border border-primary/20 bg-surface p-case-md"
      data-customer-signup-vouchers
    >
      <div className="flex min-w-0 flex-col gap-case-xs">
        <Badge variant="primary">{copy.registerForCodes}</Badge>
        <h3 className="text-heading-3 font-semibold text-foreground">
          {copy.voucherPanelTitle}
        </h3>
        <p className="text-small leading-6 text-text-muted">
          {copy.voucherPanelDescription}
        </p>
      </div>
      <div className="mt-case-md grid gap-case-sm">
        {vouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="grid min-w-0 gap-case-sm rounded-md border border-border bg-background p-case-sm sm:grid-cols-[minmax(0,1fr)_auto]"
            data-customer-signup-voucher={voucher.code}
            data-customer-signup-voucher-status={voucher.status}
          >
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{voucher.code}</p>
              <p className="mt-1 text-small leading-6 text-text-muted">
                {voucher.name[language]} ·{" "}
                {getVoucherDiscountLabel(voucher, language)}
              </p>
              <p className="mt-1 text-small text-text-muted">
                {copy.voucherValidUntil}:{" "}
                {formatVoucherDate(voucher.expiresAt, language)}
              </p>
            </div>
            <Badge
              className="self-start justify-self-start sm:justify-self-end"
              variant={getVoucherBadgeVariant(voucher.status)}
            >
              {getVoucherStatusLabel(voucher.status, copy)}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
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

function getVoucherStatusLabel(
  status: CustomerSignupVoucher["status"],
  copy: (typeof customerAuthCopy)[Language],
) {
  if (status === "available") return copy.voucherAvailable;
  if (status === "used") return copy.voucherUsed;
  if (status === "expired") return copy.voucherExpired;
  return copy.voucherReserved;
}

function getVoucherBadgeVariant(status: CustomerSignupVoucher["status"]) {
  if (status === "available") return "success";
  if (status === "reserved") return "warning";
  if (status === "used") return "neutral";
  return "error";
}

function formatVoucherDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}
