import type { MetadataRoute } from "next";
import { locales, localeTags } from "@/i18n/routing";
import { absoluteUrl, localePath } from "@/lib/seo";

const PAGES = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/availability", priority: 0.9, changeFrequency: "hourly" },
  { path: "/pickleball-court-nadiad", priority: 0.9, changeFrequency: "weekly" },
  { path: "/cricket-football-turf-nadiad", priority: 0.9, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      lastModified: new Date(),
      changeFrequency,
      priority: locale === "en" ? priority : priority - 0.1,
      alternates: { languages: Object.fromEntries(locales.map((l) => [localeTags[l], absoluteUrl(localePath(l, path))])) },
    })),
  );
}
