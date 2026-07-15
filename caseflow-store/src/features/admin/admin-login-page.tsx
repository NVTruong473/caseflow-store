"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge, Button, Container, ErrorMessage, Input } from "@/components/ui";

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

export function AdminLoginPage() {
  const router = useRouter();
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
      nextErrors.email = "Enter the admin email address.";
    }

    if (password.length < 8) {
      nextErrors.password = "Enter the admin password.";
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
          message: payload.error?.message ?? "Admin sign-in failed.",
        });
        return;
      }

      setPassword("");
      setLoginState({
        status: "success",
        displayName: payload.data.displayName,
      });
      router.replace("/admin/orders");
      router.refresh();
    } catch {
      setLoginState({
        status: "error",
        message: "Admin service is unavailable. Try again before continuing.",
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
            Back to storefront
          </Link>

          <div className="flex max-w-3xl flex-col gap-case-sm">
            <Badge variant="primary">Admin workspace</Badge>
            <h1 className="text-heading-1 font-semibold text-foreground">
              Admin login
            </h1>
            <p className="text-body leading-7 text-text-muted">
              Sign in to review guest orders and update fulfillment status.
            </p>
          </div>

          <dl className="grid gap-case-sm sm:grid-cols-3">
            <LoginMetric label="Identity" value="Supabase Auth" />
            <LoginMetric label="Access" value="Admin role" />
            <LoginMetric label="Scope" value="Orders" />
          </dl>
        </section>

        <section
          className="rounded-lg border border-border bg-surface p-case-lg"
          data-admin-login-panel
        >
          <div className="flex items-start justify-between gap-case-md">
            <div className="min-w-0">
              <h2 className="text-heading-2 font-semibold text-foreground">
                Sign in
              </h2>
              <p className="mt-case-xs text-small leading-6 text-text-muted">
                Use the dedicated CaseFlow admin account.
              </p>
            </div>
            <Badge variant="neutral" data-admin-login-session-state="empty">
              Signed out
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
              label="Email address"
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
              label="Password"
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
                Signed in as {loginState.displayName}. Opening orders.
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              isLoading={loginState.status === "checking"}
              data-admin-login-submit
            >
              {loginState.status === "checking" ? "Signing in" : "Sign in"}
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
