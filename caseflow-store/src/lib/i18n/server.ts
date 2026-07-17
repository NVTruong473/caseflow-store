import { cookies } from "next/headers";

import { LANGUAGE_COOKIE, parseLanguage } from "./language";

export async function getRequestLanguage() {
  const cookieStore = await cookies();

  return parseLanguage(cookieStore.get(LANGUAGE_COOKIE)?.value);
}
