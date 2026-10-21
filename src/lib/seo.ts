import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, locales, localeTags, type Locale } from "@/i18n/routing";

/** URL path for a locale ("as-needed": English has no prefix). */
export function localePath(locale: Locale, path = "/") {
  const clean = path === "/" ? "" : path;
  return locale === defaultLocale ? clean || "/" : `/${locale}${clean}`;
}

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}

/** Title, description, canonical + hreflang alternates and Open Graph for a public page. */
export function pageMetadata({ locale, path, title, description }: { locale: Locale; path: string; title: string; description: string }): Metadata {
  const languages = Object.fromEntries(locales.map((l) => [localeTags[l], localePath(l, path)]));
  return {
    title,
    description,
    keywords: [...siteConfig.seoKeywords],
    alternates: {
      canonical: localePath(locale, path),
      languages: { ...languages, "x-default": localePath(defaultLocale, path) },
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.legalName,
      title,
      description,
      url: localePath(locale, path),
      locale: localeTags[locale].replace("-", "_"),
      images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: siteConfig.legalName }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/images/og.jpg"] },
  };
}
