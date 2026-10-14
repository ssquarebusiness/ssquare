"use client";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, locales } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Language switch for the public site — plain links so search engines can follow them. */
export function LanguageLinks({ className, dark }: { className?: string; dark?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label="Language" className={cn("flex items-center gap-1", className)}>
      <Languages className={cn("size-4", dark ? "text-brand-200" : "text-zinc-500")} aria-hidden />
      {locales.map((l) => (
        <Link key={l} href={pathname} locale={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}
          className={cn("rounded-full px-2.5 py-1 text-sm font-medium",
            l === locale ? (dark ? "bg-white/15 text-white" : "bg-brand-100 text-brand-900") : dark ? "text-brand-100" : "text-zinc-600 hover:text-brand-800")}>
          {localeNames[l]}
        </Link>
      ))}
    </nav>
  );
}
