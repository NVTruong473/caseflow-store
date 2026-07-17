import { cookies } from "next/headers";
import { z } from "zod";

import { API_ERROR_CODES } from "@/lib/api/error-codes";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/language";

const languagePreferenceSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES),
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError(
      {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid JSON body.",
      },
      400,
    );
  }

  const parsedPayload = languagePreferenceSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return apiError(
      {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: "Language must be en or vi.",
      },
      400,
    );
  }

  const cookieStore = await cookies();

  cookieStore.set(LANGUAGE_COOKIE, parsedPayload.data.language, {
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return apiSuccess({ language: parsedPayload.data.language });
}
