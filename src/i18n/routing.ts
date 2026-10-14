import { defineRouting } from "next-intl/routing";

export const locales = ["en", "gu", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/** Cookie that stores the staff app language. */
export const STAFF_LOCALE_COOKIE = "staff_locale";

export const localeNames: Record<Locale, string> = {
  en: "English",
  gu: "ગુજરાતી",
  hi: "हिन्दी",
};

/** BCP-47 tags used for Intl formatting and hreflang. */
export const localeTags: Record<Locale, string> = {
  en: "en-IN",
  gu: "gu-IN",
  hi: "hi-IN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English lives at "/", Gujarati at "/gu", Hindi at "/hi" — clean URLs for SEO.
  localePrefix: "as-needed",
  // Don't auto-redirect by browser language: search engines must see stable URLs.
  localeDetection: false,
});
