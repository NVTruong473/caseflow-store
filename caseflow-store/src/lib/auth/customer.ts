import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bookShippingAddressSchema } from "@/lib/validation/domain";
import type {
  CustomerProfileUpdateRequest,
} from "@/lib/validation/domain";
import type {
  CustomerRequiredProfileField,
  ShippingAddress,
  UserRole,
} from "@/types/domain";

export type CustomerAuthIdentity = {
  id: string;
  email: string;
  displayName: string;
  fullName: string | null;
  role: UserRole;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  phone: string | null;
  defaultShippingAddress: ShippingAddress | null;
  profileCompleteness: {
    isCompleteForCheckout: boolean;
    missingFields: CustomerRequiredProfileField[];
  };
};

export type CustomerAuthState =
  | { status: "anonymous" }
  | { status: "authenticated"; user: CustomerAuthIdentity }
  | { status: "error"; message: string };

type ProfileRow = {
  default_shipping_address: unknown;
  display_name: string | null;
  email: string | null;
  email_verified_at: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
};

type EnsureProfileResult =
  | { success: true; user: CustomerAuthIdentity }
  | { success: false; message: string };

type UpdateProfileResult =
  | { success: true; user: CustomerAuthIdentity }
  | { success: false; status: 401 | 403 | 503; message: string };

export async function getCustomerAuthState(): Promise<CustomerAuthState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "anonymous" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "default_shipping_address,display_name,email,email_verified_at,full_name,phone,role",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      status: "error",
      message: "Customer account status is temporarily unavailable.",
    };
  }

  return {
    status: "authenticated",
    user: mapAuthIdentity(user, profile),
  };
}

export async function ensureCustomerProfileForAuthUser(options: {
  fullName?: string;
  user: User;
}): Promise<EnsureProfileResult> {
  const email = options.user.email?.trim() ?? "";

  if (!email) {
    return {
      success: false,
      message: "Customer account email is missing.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: currentProfile, error: readError } = await admin
    .from("profiles")
    .select(
      "default_shipping_address,display_name,email,email_verified_at,full_name,phone,role",
    )
    .eq("id", options.user.id)
    .maybeSingle();

  if (readError) {
    return {
      success: false,
      message: "Customer profile could not be read.",
    };
  }

  const fullName = options.fullName?.trim() || null;
  const emailVerifiedAt = options.user.email_confirmed_at ?? null;

  if (!currentProfile) {
    const { data: insertedProfile, error: insertError } = await admin
      .from("profiles")
      .insert({
        id: options.user.id,
        display_name: fullName,
        role: "customer",
        full_name: fullName,
        email,
        email_verified_at: emailVerifiedAt,
      })
      .select(
        "default_shipping_address,display_name,email,email_verified_at,full_name,phone,role",
      )
      .single();

    if (insertError) {
      return {
        success: false,
        message: "Customer profile could not be created.",
      };
    }

    return {
      success: true,
      user: mapAuthIdentity(options.user, insertedProfile),
    };
  }

  const shouldBackfillName =
    currentProfile.role === "customer" &&
    fullName !== null &&
    !currentProfile.full_name;
  const { data: updatedProfile, error: updateError } = await admin
    .from("profiles")
    .update({
      email,
      email_verified_at: emailVerifiedAt,
      ...(shouldBackfillName
        ? {
            display_name: currentProfile.display_name ?? fullName,
            full_name: fullName,
          }
        : {}),
    })
    .eq("id", options.user.id)
    .select(
      "default_shipping_address,display_name,email,email_verified_at,full_name,phone,role",
    )
    .single();

  if (updateError) {
    return {
      success: false,
      message: "Customer profile could not be updated.",
    };
  }

  return {
    success: true,
    user: mapAuthIdentity(options.user, updatedProfile),
  };
}

export async function updateCustomerProfileForAuthUser(options: {
  profile: CustomerProfileUpdateRequest;
  user: User;
}): Promise<UpdateProfileResult> {
  const email = options.user.email?.trim() ?? "";

  if (!email) {
    return {
      success: false,
      status: 401,
      message: "Customer account email is missing.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: currentProfile, error: readError } = await admin
    .from("profiles")
    .select(
      "default_shipping_address,display_name,email,email_verified_at,full_name,phone,role",
    )
    .eq("id", options.user.id)
    .maybeSingle();

  if (readError) {
    return {
      success: false,
      status: 503,
      message: "Customer profile could not be read.",
    };
  }

  if (currentProfile && currentProfile.role !== "customer") {
    return {
      success: false,
      status: 403,
      message: "Customer role required.",
    };
  }

  const emailVerifiedAt =
    options.user.email_confirmed_at ?? currentProfile?.email_verified_at ?? null;
  const profileValues = {
    display_name: options.profile.fullName,
    full_name: options.profile.fullName,
    email,
    email_verified_at: emailVerifiedAt,
    phone: options.profile.phone,
    default_shipping_address: options.profile.defaultShippingAddress,
  };
  const query = currentProfile
    ? admin
        .from("profiles")
        .update(profileValues)
        .eq("id", options.user.id)
    : admin.from("profiles").insert({
        id: options.user.id,
        role: "customer",
        ...profileValues,
      });
  const { data: savedProfile, error: saveError } = await query
    .select(
      "default_shipping_address,display_name,email,email_verified_at,full_name,phone,role",
    )
    .single();

  if (saveError) {
    return {
      success: false,
      status: 503,
      message: "Customer profile could not be saved.",
    };
  }

  return {
    success: true,
    user: mapAuthIdentity(options.user, savedProfile),
  };
}

function mapAuthIdentity(
  user: User,
  profile: ProfileRow | null,
): CustomerAuthIdentity {
  const email = profile?.email?.trim() || user.email?.trim() || "";
  const fullName = profile?.full_name?.trim() || null;
  const displayName =
    fullName ||
    profile?.display_name?.trim() ||
    email ||
    "CaseFlow Books customer";
  const emailVerifiedAt =
    profile?.email_verified_at ?? user.email_confirmed_at ?? null;
  const phone = profile?.phone?.trim() || null;
  const defaultShippingAddress = parseDefaultShippingAddress(
    profile?.default_shipping_address,
  );

  return {
    id: user.id,
    email,
    displayName,
    fullName,
    role: profile?.role ?? "customer",
    emailVerified: Boolean(emailVerifiedAt),
    emailVerifiedAt,
    phone,
    defaultShippingAddress,
    profileCompleteness: getProfileCompleteness({
      defaultShippingAddress,
      email,
      fullName,
      phone,
    }),
  };
}

function parseDefaultShippingAddress(value: unknown): ShippingAddress | null {
  const parsedAddress = bookShippingAddressSchema.safeParse(value);

  return parsedAddress.success ? parsedAddress.data : null;
}

function getProfileCompleteness(options: {
  defaultShippingAddress: ShippingAddress | null;
  email: string;
  fullName: string | null;
  phone: string | null;
}) {
  const missingFields: CustomerRequiredProfileField[] = [];

  if (!options.fullName?.trim()) {
    missingFields.push("fullName");
  }

  if (!options.email.trim()) {
    missingFields.push("email");
  }

  if (!options.phone) {
    missingFields.push("phone");
  }

  if (!options.defaultShippingAddress) {
    missingFields.push("shippingAddress");
  }

  return {
    isCompleteForCheckout: missingFields.length === 0,
    missingFields,
  };
}
