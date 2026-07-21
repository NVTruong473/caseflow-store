"use client";

import * as React from "react";

import { Button, ErrorMessage, Input } from "@/components/ui";
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

type PasswordFormValues = {
  confirmPassword: string;
  currentPassword: string;
  newPassword: string;
};

type PasswordFormErrors = Partial<Record<keyof PasswordFormValues, string>>;

type PasswordState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const customerPasswordCopy = {
  en: {
    confirmPassword: "Confirm new password",
    confirmPasswordError: "New password confirmation must match.",
    currentPassword: "Current password",
    currentPasswordError: "Enter your current password.",
    description:
      "Change the password for this signed-in account. Use a different password from the one you use now.",
    newPassword: "New password",
    newPasswordError: "New password must be at least 8 characters.",
    passwordDifferentError:
      "Choose a new password that is different from the current one.",
    saveFailed: "Password could not be changed.",
    savePassword: "Change password",
    saved: "Password changed. Use the new password next time you sign in.",
    savingPassword: "Changing password",
    title: "Password",
  },
  vi: {
    confirmPassword: "Nhập lại mật khẩu mới",
    confirmPasswordError: "Mật khẩu mới nhập lại chưa khớp.",
    currentPassword: "Mật khẩu hiện tại",
    currentPasswordError: "Nhập mật khẩu hiện tại.",
    description:
      "Đổi mật khẩu cho tài khoản đang đăng nhập. Hãy dùng mật khẩu mới khác mật khẩu hiện tại.",
    newPassword: "Mật khẩu mới",
    newPasswordError: "Mật khẩu mới phải có ít nhất 8 ký tự.",
    passwordDifferentError:
      "Chọn mật khẩu mới khác với mật khẩu hiện tại.",
    saveFailed: "Chưa thể đổi mật khẩu.",
    savePassword: "Đổi mật khẩu",
    saved: "Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.",
    savingPassword: "Đang đổi mật khẩu",
    title: "Mật khẩu",
  },
} as const;

export function CustomerPasswordForm({ language }: { language: Language }) {
  const copy = customerPasswordCopy[language];
  const [values, setValues] = React.useState<PasswordFormValues>({
    confirmPassword: "",
    currentPassword: "",
    newPassword: "",
  });
  const [errors, setErrors] = React.useState<PasswordFormErrors>({});
  const [saveState, setSaveState] = React.useState<PasswordState>({
    status: "idle",
  });

  function updateField(field: keyof PasswordFormValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setSaveState({ status: "idle" });
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validatePasswordForm(copy, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSaveState({ status: "idle" });
      return;
    }

    setSaveState({ status: "saving" });

    try {
      const response = await fetch("/api/customer/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as ApiResponse<{
        passwordUpdated: boolean;
      }>;

      if (!response.ok || payload.error || !payload.data?.passwordUpdated) {
        setSaveState({
          status: "error",
          message: payload.error?.message ?? copy.saveFailed,
        });
        return;
      }

      setValues({
        confirmPassword: "",
        currentPassword: "",
        newPassword: "",
      });
      setSaveState({ status: "success", message: copy.saved });
    } catch {
      setSaveState({ status: "error", message: copy.saveFailed });
    }
  }

  return (
    <form
      className="mt-case-lg flex flex-col gap-case-md border-t border-border pt-case-lg"
      onSubmit={handleSubmit}
      noValidate
      data-customer-password-form
    >
      <div className="min-w-0">
        <h3 className="text-heading-3 font-semibold text-foreground">
          {copy.title}
        </h3>
        <p className="mt-case-xs text-small leading-6 text-text-muted">
          {copy.description}
        </p>
      </div>

      <Input
        label={copy.currentPassword}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={(event) =>
          updateField("currentPassword", event.currentTarget.value)
        }
        error={errors.currentPassword}
        data-customer-password-current
      />

      <div className="grid gap-case-md sm:grid-cols-2">
        <Input
          label={copy.newPassword}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={values.newPassword}
          onChange={(event) =>
            updateField("newPassword", event.currentTarget.value)
          }
          error={errors.newPassword}
          data-customer-password-new
        />
        <Input
          label={copy.confirmPassword}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(event) =>
            updateField("confirmPassword", event.currentTarget.value)
          }
          error={errors.confirmPassword}
          data-customer-password-confirm
        />
      </div>

      {saveState.status === "error" ? (
        <div data-customer-password-error>
          <ErrorMessage>{saveState.message}</ErrorMessage>
        </div>
      ) : null}

      {saveState.status === "success" ? (
        <div
          role="status"
          className="rounded-md border border-success bg-success/10 p-case-md text-small leading-6 text-success"
          data-customer-password-success
        >
          {saveState.message}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        isLoading={saveState.status === "saving"}
        data-customer-password-submit
      >
        {saveState.status === "saving" ? copy.savingPassword : copy.savePassword}
      </Button>
    </form>
  );
}

function validatePasswordForm(
  copy: (typeof customerPasswordCopy)[Language],
  values: PasswordFormValues,
) {
  const errors: PasswordFormErrors = {};

  if (values.currentPassword.length < 8) {
    errors.currentPassword = copy.currentPasswordError;
  }

  if (values.newPassword.length < 8) {
    errors.newPassword = copy.newPasswordError;
  }

  if (values.newPassword && values.newPassword === values.currentPassword) {
    errors.newPassword = copy.passwordDifferentError;
  }

  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = copy.confirmPasswordError;
  }

  return errors;
}
