"use client";

import * as React from "react";

import { Button, ErrorMessage, Input } from "@/components/ui";
import type { Language } from "@/lib/i18n/language";
import type { UserRole } from "@/types/domain";

type ApiResponse<TData> = {
  data: TData | null;
  error: { code: string; message: string } | null;
  meta: Record<string, unknown> | null;
};

type SubmitState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function CustomerPasswordForm({
  language,
  role,
}: {
  language: Language;
  role: UserRole;
}) {
  if (role === "customer") {
    return <CustomerRecoveryPasswordForm language={language} />;
  }

  return <OperationsPasswordForm language={language} />;
}

function CustomerRecoveryPasswordForm({ language }: { language: Language }) {
  const copy = passwordCopy[language];
  const [codeState, setCodeState] = React.useState<
    | { status: "idle" }
    | { status: "requesting" }
    | { status: "sent"; deliveryAddress: string }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const interval = window.setInterval(
      () => setCooldown((current) => Math.max(0, current - 1)),
      1000,
    );

    return () => window.clearInterval(interval);
  }, [cooldown]);

  async function requestCode() {
    setCodeState({ status: "requesting" });

    try {
      const response = await fetch("/api/customer/password/code", {
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse<{
        recoveryRequested: true;
        deliveryAddress: string;
      }>;

      if (!response.ok || !payload.data) {
        setCodeState({
          status: "error",
          message: payload.error?.message ?? copy.requestFailed,
        });
        if (response.status === 429) {
          setCooldown(60);
        }
        return;
      }

      setCodeState({
        status: "sent",
        deliveryAddress: payload.data.deliveryAddress,
      });
      setCooldown(60);
    } catch {
      setCodeState({ status: "error", message: copy.requestFailed });
    }
  }

  return (
    <section
      className="mt-case-lg flex flex-col gap-case-md border-t border-border pt-case-lg"
      data-customer-password-form
      data-password-assurance="email-recovery-link"
    >
      <PasswordHeading
        description={copy.customerDescription}
        title={copy.title}
      />

      <div className="flex flex-col gap-case-sm border-y border-border py-case-md sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{copy.emailCodeTitle}</p>
          <p className="mt-1 text-small leading-6 text-text-muted">
            {copy.emailCodeDescription}
          </p>
          {codeState.status === "sent" ? (
            <p
              className="mt-1 text-small font-medium text-success"
              role="status"
              data-customer-password-code-sent
            >
              {copy.codeSent(codeState.deliveryAddress)}
            </p>
          ) : null}
        </div>
        <Button
          className="shrink-0"
          disabled={cooldown > 0}
          isLoading={codeState.status === "requesting"}
          onClick={() => void requestCode()}
          type="button"
          variant="secondary"
          data-customer-password-code-request
        >
          {codeState.status === "requesting"
            ? copy.requestingCode
            : cooldown > 0
              ? copy.resendIn(cooldown)
              : codeState.status === "sent"
                ? copy.resendCode
                : copy.requestCode}
        </Button>
      </div>

      {codeState.status === "error" ? (
        <ErrorMessage>{codeState.message}</ErrorMessage>
      ) : null}
    </section>
  );
}

function OperationsPasswordForm({ language }: { language: Language }) {
  const copy = passwordCopy[language];
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [operationsSecret, setOperationsSecret] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitState, setSubmitState] =
    React.useState<SubmitState>({ status: "idle" });
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateOperationsPassword({
      confirmPassword,
      copy,
      currentPassword,
      newPassword,
      operationsSecret,
    });

    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setFieldError(null);
    setSubmitState({ status: "saving" });

    try {
      const response = await fetch("/api/customer/password", {
        body: JSON.stringify({
          confirmPassword,
          currentPassword,
          newPassword,
          operationsSecret,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json()) as ApiResponse<{
        passwordUpdated: true;
        signedOut: boolean;
      }>;

      if (!response.ok || !payload.data?.passwordUpdated) {
        setSubmitState({
          status: "error",
          message: payload.error?.message ?? copy.saveFailed,
        });
        return;
      }

      setCurrentPassword("");
      setOperationsSecret("");
      setNewPassword("");
      setConfirmPassword("");
      setSubmitState({
        status: "success",
        message: copy.saved(payload.data.signedOut),
      });
    } catch {
      setSubmitState({ status: "error", message: copy.saveFailed });
    }
  }

  return (
    <form
      className="mt-case-lg flex flex-col gap-case-md border-t border-border pt-case-lg"
      data-customer-password-form
      data-password-assurance="operations-secret"
      noValidate
      onSubmit={submit}
    >
      <PasswordHeading
        description={copy.operationsDescription}
        title={copy.title}
      />

      <div className="grid gap-case-md sm:grid-cols-2">
        <Input
          autoComplete="current-password"
          label={copy.currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.currentTarget.value);
            setSubmitState({ status: "idle" });
            setFieldError(null);
          }}
          type="password"
          value={currentPassword}
          data-customer-password-current
        />
        <Input
          autoComplete="off"
          hint={copy.operationsSecretHint}
          label={copy.operationsSecret}
          onChange={(event) => {
            setOperationsSecret(event.currentTarget.value);
            setSubmitState({ status: "idle" });
            setFieldError(null);
          }}
          type="password"
          value={operationsSecret}
          data-operations-password-secret
        />
      </div>

      <NewPasswordFields
        confirmPassword={confirmPassword}
        copy={copy}
        newPassword={newPassword}
        onConfirmPasswordChange={(value) => {
          setConfirmPassword(value);
          setSubmitState({ status: "idle" });
          setFieldError(null);
        }}
        onNewPasswordChange={(value) => {
          setNewPassword(value);
          setSubmitState({ status: "idle" });
          setFieldError(null);
        }}
      />

      <ErrorMessage>{fieldError}</ErrorMessage>
      <PasswordFeedback state={submitState} />

      <Button
        isLoading={submitState.status === "saving"}
        size="lg"
        type="submit"
        data-customer-password-submit
      >
        {submitState.status === "saving"
          ? copy.savingPassword
          : copy.savePassword}
      </Button>
    </form>
  );
}

function NewPasswordFields({
  confirmPassword,
  copy,
  newPassword,
  onConfirmPasswordChange,
  onNewPasswordChange,
}: {
  confirmPassword: string;
  copy: (typeof passwordCopy)[Language];
  newPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-case-md sm:grid-cols-2">
      <Input
        autoComplete="new-password"
        label={copy.newPassword}
        onChange={(event) => onNewPasswordChange(event.currentTarget.value)}
        type="password"
        value={newPassword}
        data-customer-password-new
      />
      <Input
        autoComplete="new-password"
        label={copy.confirmPassword}
        onChange={(event) =>
          onConfirmPasswordChange(event.currentTarget.value)
        }
        type="password"
        value={confirmPassword}
        data-customer-password-confirm
      />
    </div>
  );
}

function PasswordHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-heading-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-case-xs text-small leading-6 text-text-muted">
        {description}
      </p>
    </div>
  );
}

function PasswordFeedback({ state }: { state: SubmitState }) {
  if (state.status === "error") {
    return (
      <div data-customer-password-error>
        <ErrorMessage>{state.message}</ErrorMessage>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div
        className="rounded-md border border-success bg-success/10 p-case-md text-small leading-6 text-success"
        data-customer-password-success
        role="status"
      >
        {state.message}
      </div>
    );
  }

  return null;
}

function validateOperationsPassword(input: {
  confirmPassword: string;
  copy: (typeof passwordCopy)[Language];
  currentPassword: string;
  newPassword: string;
  operationsSecret: string;
}) {
  if (input.currentPassword.length < 8) {
    return input.copy.currentPasswordError;
  }
  if (input.operationsSecret.length < 6) {
    return input.copy.operationsSecretError;
  }
  if (input.newPassword.length < 8) {
    return input.copy.newPasswordError;
  }
  if (input.newPassword === input.currentPassword) {
    return input.copy.passwordDifferentError;
  }
  if (input.confirmPassword !== input.newPassword) {
    return input.copy.confirmPasswordError;
  }
  return null;
}

const passwordCopy = {
  en: {
    codeSent: (email: string) =>
      `Secure password link sent to ${email}. Open it to choose a new password.`,
    confirmPassword: "Confirm new password",
    confirmPasswordError: "New password confirmation must match.",
    currentPassword: "Current password",
    currentPasswordError: "Enter your current password.",
    customerDescription:
      "Password changes start from a single-use link sent to the email on this account.",
    emailCodeDescription:
      "The link can only be sent to the signed-in account email and expires under the authentication policy.",
    emailCodeTitle: "Verify by email",
    newPassword: "New password",
    newPasswordError: "New password must be at least 8 characters.",
    operationsDescription:
      "Operations accounts require the current password and the store verification key.",
    operationsSecret: "Store verification key",
    operationsSecretError: "Enter the store verification key.",
    operationsSecretHint:
      "Use the server-managed key supplied by the store owner.",
    passwordDifferentError:
      "Choose a new password that is different from the current one.",
    requestCode: "Send secure password link",
    requestFailed: "Password reset email could not be sent.",
    requestingCode: "Sending code",
    resendCode: "Send another code",
    resendIn: (seconds: number) => `Resend in ${seconds}s`,
    saveFailed: "Password could not be changed.",
    savePassword: "Verify and change password",
    saved: (signedOut: boolean) =>
      signedOut
        ? "Password changed. Existing sessions were signed out; use the new password next time."
        : "Password changed. Sign out of other devices before continuing.",
    savingPassword: "Changing password",
    title: "Password security",
  },
  vi: {
    codeSent: (email: string) =>
      `Đã gửi liên kết bảo mật tới ${email}. Mở liên kết để đặt mật khẩu mới.`,
    confirmPassword: "Nhập lại mật khẩu mới",
    confirmPasswordError: "Mật khẩu mới nhập lại chưa khớp.",
    currentPassword: "Mật khẩu hiện tại",
    currentPasswordError: "Hãy nhập mật khẩu hiện tại.",
    customerDescription:
      "Mọi thay đổi mật khẩu đều bắt đầu từ liên kết dùng một lần gửi tới email của tài khoản.",
    emailCodeDescription:
      "Liên kết chỉ được gửi tới email của tài khoản đang đăng nhập và sẽ hết hạn theo chính sách xác thực.",
    emailCodeTitle: "Xác minh qua email",
    newPassword: "Mật khẩu mới",
    newPasswordError: "Mật khẩu mới phải có ít nhất 8 ký tự.",
    operationsDescription:
      "Tài khoản vận hành cần mật khẩu hiện tại và khóa xác minh của cửa hàng.",
    operationsSecret: "Khóa xác minh cửa hàng",
    operationsSecretError: "Hãy nhập khóa xác minh cửa hàng.",
    operationsSecretHint:
      "Dùng khóa được chủ cửa hàng quản lý ở phía server.",
    passwordDifferentError:
      "Chọn mật khẩu mới khác với mật khẩu hiện tại.",
    requestCode: "Gửi liên kết đổi mật khẩu",
    requestFailed: "Chưa thể gửi email đổi mật khẩu.",
    requestingCode: "Đang gửi mã",
    resendCode: "Gửi mã khác",
    resendIn: (seconds: number) => `Gửi lại sau ${seconds}s`,
    saveFailed: "Chưa thể đổi mật khẩu.",
    savePassword: "Xác minh và đổi mật khẩu",
    saved: (signedOut: boolean) =>
      signedOut
        ? "Đã đổi mật khẩu. Các phiên cũ đã đăng xuất; lần sau hãy dùng mật khẩu mới."
        : "Đã đổi mật khẩu. Hãy chủ động đăng xuất khỏi các thiết bị khác.",
    savingPassword: "Đang đổi mật khẩu",
    title: "Bảo mật mật khẩu",
  },
} as const;
