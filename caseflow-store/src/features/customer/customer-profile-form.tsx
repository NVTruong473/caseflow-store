"use client";

import * as React from "react";

import { Badge, Button, ErrorMessage, Input } from "@/components/ui";
import type { CustomerAuthIdentity } from "@/lib/auth/customer";
import type { Language } from "@/lib/i18n/language";
import {
  customerNameSchema,
  customerPhoneSchema,
} from "@/lib/validation/domain";

type ApiErrorBody = {
  code: string;
  message: string;
};

type ApiResponse<TData> = {
  data: TData | null;
  error: ApiErrorBody | null;
  meta: Record<string, unknown> | null;
};

type ProfileFormValues = {
  district: string;
  email: string;
  fullName: string;
  line1: string;
  line2: string;
  phone: string;
  province: string;
  recipientName: string;
  shippingPhone: string;
  ward: string;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>;

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const customerProfileCopy = {
  en: {
    addressLine1: "Street address",
    addressLine1Error: "Enter the street address.",
    addressLine2: "Apartment, floor, or note",
    district: "District",
    districtError: "Enter the district.",
    email: "Email",
    emailHint: "Email belongs to the Supabase Auth account and is not changed here.",
    fullName: "Full name",
    fullNameError: "Enter your full name.",
    optional: "Optional",
    phone: "Phone",
    phoneError: "Enter a valid phone number.",
    profileComplete: "Profile complete",
    profileIncomplete: "Profile incomplete",
    profileSaved: "Profile saved.",
    profileSaveFailed: "Customer profile could not be saved.",
    province: "Province or city",
    provinceError: "Enter the province or city.",
    recipientName: "Recipient name",
    recipientNameError: "Enter the recipient name.",
    requiredForCheckout:
      "Required before account-based checkout: name, email, phone, and default shipping address.",
    saveProfile: "Save profile",
    savingProfile: "Saving profile",
    shippingAddress: "Default shipping address",
    shippingPhone: "Recipient phone",
    ward: "Ward",
  },
  vi: {
    addressLine1: "Địa chỉ đường/số nhà",
    addressLine1Error: "Nhập địa chỉ giao hàng.",
    addressLine2: "Căn hộ, tầng hoặc ghi chú",
    district: "Quận/huyện",
    districtError: "Nhập quận/huyện.",
    email: "Email",
    emailHint: "Email thuộc tài khoản Supabase Auth và không đổi tại đây.",
    fullName: "Họ và tên",
    fullNameError: "Nhập họ và tên.",
    optional: "Không bắt buộc",
    phone: "Số điện thoại",
    phoneError: "Nhập số điện thoại hợp lệ.",
    profileComplete: "Hồ sơ đã đủ",
    profileIncomplete: "Hồ sơ còn thiếu",
    profileSaved: "Đã lưu hồ sơ.",
    profileSaveFailed: "Chưa thể lưu hồ sơ khách hàng.",
    province: "Tỉnh/thành phố",
    provinceError: "Nhập tỉnh/thành phố.",
    recipientName: "Tên người nhận",
    recipientNameError: "Nhập tên người nhận.",
    requiredForCheckout:
      "Cần có trước checkout bằng tài khoản: họ tên, email, số điện thoại và địa chỉ giao hàng mặc định.",
    saveProfile: "Lưu hồ sơ",
    savingProfile: "Đang lưu",
    shippingAddress: "Địa chỉ giao hàng mặc định",
    shippingPhone: "Số điện thoại người nhận",
    ward: "Phường/xã",
  },
} as const;

export function CustomerProfileForm({
  language,
  onProfileSaved,
  user,
}: {
  language: Language;
  onProfileSaved: (user: CustomerAuthIdentity) => void;
  user: CustomerAuthIdentity;
}) {
  const copy = customerProfileCopy[language];
  const [values, setValues] = React.useState(() => getInitialValues(user));
  const [errors, setErrors] = React.useState<ProfileFormErrors>({});
  const [saveState, setSaveState] = React.useState<SaveState>({
    status: "idle",
  });
  const profileComplete = user.profileCompleteness.isCompleteForCheckout;

  function updateField(field: keyof ProfileFormValues, value: string) {
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

    const normalizedValues = normalizeValues(values);
    const nextErrors = validateProfileForm(copy, normalizedValues);

    setValues(normalizedValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSaveState({ status: "idle" });
      return;
    }

    setSaveState({ status: "saving" });

    try {
      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: normalizedValues.fullName,
          phone: normalizedValues.phone,
          defaultShippingAddress: {
            recipientName: normalizedValues.recipientName,
            phone: normalizedValues.shippingPhone,
            line1: normalizedValues.line1,
            line2: normalizedValues.line2 || null,
            ward: normalizedValues.ward || null,
            district: normalizedValues.district,
            province: normalizedValues.province,
            countryCode: "VN",
          },
        }),
      });
      const payload = (await response.json()) as ApiResponse<CustomerAuthIdentity>;

      if (!response.ok || payload.error || !payload.data) {
        setSaveState({
          status: "error",
          message: payload.error?.message ?? copy.profileSaveFailed,
        });
        return;
      }

      onProfileSaved(payload.data);
      setSaveState({ status: "success", message: copy.profileSaved });
    } catch {
      setSaveState({ status: "error", message: copy.profileSaveFailed });
    }
  }

  return (
    <form
      className="mt-case-lg flex flex-col gap-case-md border-t border-border pt-case-lg"
      onSubmit={handleSubmit}
      noValidate
      data-customer-profile-form
      data-customer-profile-state={profileComplete ? "complete" : "incomplete"}
    >
      <div className="flex flex-wrap items-start justify-between gap-case-sm">
        <div className="min-w-0">
          <h3 className="text-heading-3 font-semibold text-foreground">
            {copy.shippingAddress}
          </h3>
          <p className="mt-case-xs text-small leading-6 text-text-muted">
            {copy.requiredForCheckout}
          </p>
        </div>
        <Badge variant={profileComplete ? "success" : "warning"}>
          {profileComplete ? copy.profileComplete : copy.profileIncomplete}
        </Badge>
      </div>

      <div className="grid gap-case-md sm:grid-cols-2">
        <Input
          label={copy.fullName}
          name="fullName"
          type="text"
          autoComplete="name"
          value={values.fullName}
          onChange={(event) => updateField("fullName", event.currentTarget.value)}
          error={errors.fullName}
          data-customer-profile-full-name
        />
        <Input
          label={copy.email}
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          disabled
          hint={copy.emailHint}
          onChange={() => undefined}
          data-customer-profile-email
        />
        <Input
          label={copy.phone}
          name="phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(event) => updateField("phone", event.currentTarget.value)}
          error={errors.phone}
          data-customer-profile-phone
        />
        <Input
          label={copy.recipientName}
          name="recipientName"
          type="text"
          autoComplete="shipping name"
          value={values.recipientName}
          onChange={(event) =>
            updateField("recipientName", event.currentTarget.value)
          }
          error={errors.recipientName}
          data-customer-profile-recipient-name
        />
        <Input
          label={copy.shippingPhone}
          name="shippingPhone"
          type="tel"
          autoComplete="shipping tel"
          value={values.shippingPhone}
          onChange={(event) =>
            updateField("shippingPhone", event.currentTarget.value)
          }
          error={errors.shippingPhone}
          data-customer-profile-shipping-phone
        />
        <Input
          label={copy.addressLine1}
          name="line1"
          type="text"
          autoComplete="shipping address-line1"
          value={values.line1}
          onChange={(event) => updateField("line1", event.currentTarget.value)}
          error={errors.line1}
          data-customer-profile-line1
        />
        <Input
          label={copy.addressLine2}
          name="line2"
          type="text"
          autoComplete="shipping address-line2"
          value={values.line2}
          hint={copy.optional}
          onChange={(event) => updateField("line2", event.currentTarget.value)}
          error={errors.line2}
          data-customer-profile-line2
        />
        <Input
          label={copy.ward}
          name="ward"
          type="text"
          autoComplete="shipping address-level4"
          value={values.ward}
          hint={copy.optional}
          onChange={(event) => updateField("ward", event.currentTarget.value)}
          error={errors.ward}
          data-customer-profile-ward
        />
        <Input
          label={copy.district}
          name="district"
          type="text"
          autoComplete="shipping address-level2"
          value={values.district}
          onChange={(event) => updateField("district", event.currentTarget.value)}
          error={errors.district}
          data-customer-profile-district
        />
        <Input
          label={copy.province}
          name="province"
          type="text"
          autoComplete="shipping address-level1"
          value={values.province}
          onChange={(event) => updateField("province", event.currentTarget.value)}
          error={errors.province}
          data-customer-profile-province
        />
      </div>

      {saveState.status === "error" ? (
        <div data-customer-profile-error>
          <ErrorMessage>{saveState.message}</ErrorMessage>
        </div>
      ) : null}

      {saveState.status === "success" ? (
        <div
          role="status"
          className="rounded-md border border-success bg-success/10 p-case-md text-small leading-6 text-success"
          data-customer-profile-success
        >
          {saveState.message}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        isLoading={saveState.status === "saving"}
        data-customer-profile-submit
      >
        {saveState.status === "saving" ? copy.savingProfile : copy.saveProfile}
      </Button>
    </form>
  );
}

function getInitialValues(user: CustomerAuthIdentity): ProfileFormValues {
  const address = user.defaultShippingAddress;
  const fullName = user.fullName ?? user.displayName;

  return {
    district: address?.district ?? "",
    email: user.email,
    fullName,
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    phone: user.phone ?? "",
    province: address?.province ?? "",
    recipientName: address?.recipientName ?? fullName,
    shippingPhone: address?.phone ?? user.phone ?? "",
    ward: address?.ward ?? "",
  };
}

function normalizeValues(values: ProfileFormValues): ProfileFormValues {
  return {
    district: values.district.trim(),
    email: values.email.trim(),
    fullName: values.fullName.trim(),
    line1: values.line1.trim(),
    line2: values.line2.trim(),
    phone: values.phone.trim(),
    province: values.province.trim(),
    recipientName: values.recipientName.trim(),
    shippingPhone: values.shippingPhone.trim(),
    ward: values.ward.trim(),
  };
}

function validateProfileForm(
  copy: (typeof customerProfileCopy)[Language],
  values: ProfileFormValues,
) {
  const errors: ProfileFormErrors = {};

  if (!customerNameSchema.safeParse(values.fullName).success) {
    errors.fullName = copy.fullNameError;
  }

  if (!customerPhoneSchema.safeParse(values.phone).success) {
    errors.phone = copy.phoneError;
  }

  if (!customerNameSchema.safeParse(values.recipientName).success) {
    errors.recipientName = copy.recipientNameError;
  }

  if (!customerPhoneSchema.safeParse(values.shippingPhone).success) {
    errors.shippingPhone = copy.phoneError;
  }

  if (!values.line1) {
    errors.line1 = copy.addressLine1Error;
  }

  if (!values.district) {
    errors.district = copy.districtError;
  }

  if (!values.province) {
    errors.province = copy.provinceError;
  }

  return errors;
}
