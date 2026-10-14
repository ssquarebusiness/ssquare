import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, STAFF_LOCALE_COOKIE } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Public pages pass the [locale] segment; staff pages fall back to the staff language cookie.
  let locale = await requestLocale;
  if (!isLocale(locale)) {
    const fromCookie = (await cookies()).get(STAFF_LOCALE_COOKIE)?.value;
    locale = isLocale(fromCookie) ? fromCookie : defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Kolkata",
  };
});
