"use client";

import Link from "next/link";
import * as React from "react";

import { Badge, Button, Container, ErrorMessage, Input } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
};

type AdminIdentity = {
  email: string;
  displayName: string;
};

type LoginState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "success"; displayName: string }
  | { status: "error"; message: string };

type FieldErrors = {
  email?: string;
  password?: string;
};

const adminLoginCopy = {
  en: {
    access: "Access",
    accessValue: "Admin or staff role",
    adminEmailError: "Enter the operations email address.",
    adminPasswordError: "Enter the admin password.",
    adminServiceUnavailable:
      "Operations service is unavailable. Try again before continuing.",
    adminSignInFailed: "Operations sign-in failed.",
    adminWorkspace: "Operations workspace",
    backToStorefront: "Back to storefront",
    emailAddress: "Email address",
    identity: "Identity",
    identityValue: "Store staff account",
    openingOrders: (name: string) => `Signed in as ${name}. Opening orders.`,
    password: "Password",
    scope: "Scope",
    scopeValue: "Orders and operations",
    signIn: "Sign in",
    signInDescription: "Use a CaseFlow admin or staff account.",
    signInIntro: "Sign in to review orders and update fulfillment status.",
    signingIn: "Signing in",
    signedOut: "Signed out",
    title: "Operations login",
  },
  vi: {
    access: "Quyền truy cập",
    accessValue: "Vai trò quản trị hoặc vận hành",
    adminEmailError: "Nhập email vận hành.",
    adminPasswordError: "Nhập mật khẩu admin/staff.",
    adminServiceUnavailable:
      "Dịch vụ vận hành chưa khả dụng. Vui lòng thử lại trước khi tiếp tục.",
    adminSignInFailed: "Đăng nhập vận hành thất bại.",
    adminWorkspace: "Khu vực vận hành",
    backToStorefront: "Quay lại cửa hàng",
    emailAddress: "Địa chỉ email",
    identity: "Định danh",
    identityValue: "Tài khoản nhân sự cửa hàng",
    openingOrders: (name: string) => `Đã đăng nhập với tên ${name}. Đang mở đơn hàng.`,
    password: "Mật khẩu",
    scope: "Phạm vi",
    scopeValue: "Đơn hàng và vận hành",
    signIn: "Đăng nhập",
    signInDescription: "Dùng tài khoản admin hoặc staff của CaseFlow.",
    signInIntro: "Đăng nhập để xem đơn hàng và cập nhật trạng thái xử lý.",
    signingIn: "Đang đăng nhập",
    signedOut: "Đã đăng xuất",
    title: "Đăng nhập vận hành",
  },
} as const;

export function AdminLoginPage({ language }: { language: Language }) {
  const copy = adminLoginCopy[language];
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [loginState, setLoginState] = React.useState<LoginState>({
    status: "idle",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    const nextErrors: FieldErrors = {};

    if (!normalizedEmail) {
      nextErrors.email = copy.adminEmailError;
    }

    if (password.length < 8) {
      nextErrors.password = copy.adminPasswordError;
    }

    setEmail(normalizedEmail);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setLoginState({ status: "idle" });
      return;
    }

    setLoginState({ status: "checking" });

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const payload = (await response.json()) as ApiResponse<AdminIdentity>;

      if (!response.ok || payload.error || !payload.data) {
        setPassword("");
        setLoginState({
          status: "error",
          message: payload.error?.message ?? copy.adminSignInFailed,
        });
        return;
      }

      setPassword("");
      setLoginState({
        status: "success",
        displayName: payload.data.displayName,
      });
      window.location.replace("/admin");
    } catch {
      setLoginState({
        status: "error",
        message: copy.adminServiceUnavailable,
      });
    }
  }

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-admin-login-page
    >
      <Container className="grid gap-case-xl lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <section className="flex min-w-0 flex-col gap-case-lg">
          <Link
            href="/"
            className="w-fit text-small font-medium text-primary hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.backToStorefront}
          </Link>

          <div className="flex max-w-3xl flex-col gap-case-sm">
            <Badge variant="primary">{copy.adminWorkspace}</Badge>
            <h1 className="text-heading-1 font-semibold text-foreground">
              {copy.title}
            </h1>
            <p className="text-body leading-7 text-text-muted">
              {copy.signInIntro}
            </p>
          </div>

          <dl className="grid gap-case-sm sm:grid-cols-3">
            <LoginMetric label={copy.identity} value={copy.identityValue} />
            <LoginMetric label={copy.access} value={copy.accessValue} />
            <LoginMetric label={copy.scope} value={copy.scopeValue} />
          </dl>
        </section>

        <section
          className="rounded-lg border border-border bg-surface p-case-lg"
          data-admin-login-panel
        >
          <div className="flex items-start justify-between gap-case-md">
            <div className="min-w-0">
              <h2 className="text-heading-2 font-semibold text-foreground">
                {copy.signIn}
              </h2>
              <p className="mt-case-xs text-small leading-6 text-text-muted">
                {copy.signInDescription}
              </p>
            </div>
            <Badge variant="neutral" data-admin-login-session-state="empty">
              {copy.signedOut}
            </Badge>
          </div>

          <form
            className="mt-case-lg flex flex-col gap-case-md"
            onSubmit={handleSubmit}
            noValidate
            data-admin-login-form
          >
            <Input
              id="admin-email"
              label={copy.emailAddress}
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => {
                setEmail(event.currentTarget.value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
                if (loginState.status === "error") {
                  setLoginState({ status: "idle" });
                }
              }}
              error={fieldErrors.email}
              data-admin-login-email
            />

            <Input
              id="admin-password"
              label={copy.password}
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                setFieldErrors((current) => ({
                  ...current,
                  password: undefined,
                }));
                if (loginState.status === "error") {
                  setLoginState({ status: "idle" });
                }
              }}
              error={fieldErrors.password}
              data-admin-login-password
            />

            {loginState.status === "error" ? (
              <div data-admin-login-error>
                <ErrorMessage>{loginState.message}</ErrorMessage>
              </div>
            ) : null}

            {loginState.status === "success" ? (
              <div
                role="status"
                className="rounded-md border border-success bg-success/10 p-case-md text-small leading-6 text-success"
                data-admin-login-success
              >
                {copy.openingOrders(loginState.displayName)}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              isLoading={loginState.status === "checking"}
              data-admin-login-submit
            >
              {loginState.status === "checking" ? copy.signingIn : copy.signIn}
            </Button>
          </form>
        </section>
      </Container>
    </main>
  );
}

function LoginMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-case-md">
      <dt className="text-small text-text-muted">{label}</dt>
      <dd className="mt-case-xs font-semibold text-foreground">{value}</dd>
    </div>
  );
}
