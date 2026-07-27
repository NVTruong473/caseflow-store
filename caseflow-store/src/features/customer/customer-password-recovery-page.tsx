"use client";

import Link from "next/link";
import * as React from "react";

import { Badge, Button, Container, ErrorMessage, Input } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type RecoveryState =
  | { status: "checking" }
  | { status: "ready" }
  | { status: "saving" }
  | { status: "invalid"; message: string }
  | { status: "error"; message: string };

export function CustomerPasswordRecoveryPage({
  language,
}: {
  language: Language;
}) {
  const copy = recoveryCopy[language];
  const [state, setState] = React.useState<RecoveryState>({
    status: "checking",
  });
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    void initializeRecoverySession();

    async function initializeRecoverySession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const recoveryType = hash.get("type");
      const providerError = hash.get("error_description");

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );

      await Promise.resolve();

      if (!active) {
        return;
      }

      if (
        providerError ||
        recoveryType !== "recovery" ||
        !accessToken ||
        !refreshToken
      ) {
        setState({
          status: "invalid",
          message: providerError
            ? decodeURIComponent(providerError.replace(/\+/g, " "))
            : copy.invalid,
        });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (!active) {
        return;
      }

      if (error || !data.user) {
        setState({ status: "invalid", message: copy.invalid });
        return;
      }

      setState({ status: "ready" });
    }

    return () => {
      active = false;
    };
  }, [copy.invalid]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 8) {
      setFieldError(copy.passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldError(copy.confirmError);
      return;
    }

    setFieldError(null);
    setState({ status: "saving" });

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setState({ status: "error", message: copy.updateFailed });
      return;
    }

    const globalSignOut = await supabase.auth.signOut({ scope: "global" });
    if (globalSignOut.error) {
      await supabase.auth.signOut({ scope: "local" });
    }

    setNewPassword("");
    setConfirmPassword("");
    window.location.replace("/account?passwordChanged=1");
  }

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-customer-password-recovery-page
    >
      <Container className="grid gap-case-xl lg:grid-cols-[minmax(0,0.75fr)_minmax(360px,1.25fr)] lg:items-start">
        <section className="max-w-xl">
          <Badge variant="primary">{copy.badge}</Badge>
          <h1 className="mt-case-md text-heading-1 font-semibold text-foreground">
            {copy.title}
          </h1>
          <p className="mt-case-sm text-body leading-7 text-text-muted">
            {copy.description}
          </p>
        </section>

        <section className="rounded-lg border border-border bg-surface p-case-lg">
          {state.status === "checking" ? (
            <p role="status" className="text-body text-text-muted">
              {copy.checking}
            </p>
          ) : null}

          {state.status === "invalid" ? (
            <RecoveryFailure
              language={language}
              message={state.message}
              title={copy.invalidTitle}
            />
          ) : null}

          {state.status === "ready" ||
          state.status === "saving" ||
          state.status === "error" ? (
            <form
              className="flex flex-col gap-case-md"
              data-customer-password-recovery-form
              noValidate
              onSubmit={submit}
            >
              <h2 className="text-heading-2 font-semibold text-foreground">
                {copy.formTitle}
              </h2>
              <Input
                autoComplete="new-password"
                label={copy.newPassword}
                onChange={(event) => {
                  setNewPassword(event.currentTarget.value);
                  setFieldError(null);
                  if (state.status === "error") {
                    setState({ status: "ready" });
                  }
                }}
                type="password"
                value={newPassword}
                data-customer-password-recovery-new
              />
              <Input
                autoComplete="new-password"
                label={copy.confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.currentTarget.value);
                  setFieldError(null);
                  if (state.status === "error") {
                    setState({ status: "ready" });
                  }
                }}
                type="password"
                value={confirmPassword}
                data-customer-password-recovery-confirm
              />
              <ErrorMessage>{fieldError}</ErrorMessage>
              {state.status === "error" ? (
                <ErrorMessage>{state.message}</ErrorMessage>
              ) : null}
              <Button
                isLoading={state.status === "saving"}
                size="lg"
                type="submit"
                data-customer-password-recovery-submit
              >
                {state.status === "saving" ? copy.saving : copy.submit}
              </Button>
            </form>
          ) : null}
        </section>
      </Container>
    </main>
  );
}

function RecoveryFailure({
  language,
  message,
  title,
}: {
  language: Language;
  message: string;
  title: string;
}) {
  return (
    <div data-customer-password-recovery-invalid>
      <h2 className="text-heading-2 font-semibold text-foreground">{title}</h2>
      <p className="mt-case-sm text-small leading-6 text-text-muted">
        {message}
      </p>
      <Link
        href="/account"
        className="mt-case-lg inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 py-2 font-medium text-foreground hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {language === "vi" ? "Về trang tài khoản" : "Back to account"}
      </Link>
    </div>
  );
}

const recoveryCopy = {
  en: {
    badge: "Email verification",
    checking: "Checking the secure link...",
    confirmError: "New password confirmation must match.",
    confirmPassword: "Confirm new password",
    description:
      "This page only accepts the single-use link sent to your account email. The link is removed from the address bar before you enter a new password.",
    formTitle: "Choose a new password",
    invalid: "This password link is invalid, expired, or already used.",
    invalidTitle: "The secure link is unavailable",
    newPassword: "New password",
    passwordError: "New password must be at least 8 characters.",
    saving: "Changing password",
    submit: "Change password",
    title: "Set a new account password",
    updateFailed:
      "The password could not be changed. Request a new link from your account.",
  },
  vi: {
    badge: "Xác minh qua email",
    checking: "Đang kiểm tra liên kết bảo mật...",
    confirmError: "Mật khẩu mới nhập lại chưa khớp.",
    confirmPassword: "Nhập lại mật khẩu mới",
    description:
      "Trang này chỉ chấp nhận liên kết dùng một lần được gửi tới email tài khoản. Liên kết được xóa khỏi thanh địa chỉ trước khi bạn nhập mật khẩu mới.",
    formTitle: "Chọn mật khẩu mới",
    invalid: "Liên kết đổi mật khẩu không hợp lệ, đã hết hạn hoặc đã được dùng.",
    invalidTitle: "Liên kết bảo mật không còn hiệu lực",
    newPassword: "Mật khẩu mới",
    passwordError: "Mật khẩu mới phải có ít nhất 8 ký tự.",
    saving: "Đang đổi mật khẩu",
    submit: "Đổi mật khẩu",
    title: "Đặt mật khẩu mới cho tài khoản",
    updateFailed:
      "Chưa thể đổi mật khẩu. Hãy yêu cầu liên kết mới từ trang tài khoản.",
  },
} as const;
