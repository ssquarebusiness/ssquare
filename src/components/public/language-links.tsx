"use client";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, locales } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Language switch for the public site — plain links so search engines can follow them. */
export function LanguageLinks({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label="Language" className={cn("flex items-center gap-3 text-[13px] font-semibold", className)}>
      {locales.map((l) => (
        <Link key={l} href={pathname} locale={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}
          className={cn(l === locale ? "text-ink" : "text-zinc-500 hover:text-ink")}>
          {localeNames[l]}
        </Link>
      ))}
    </nav>
  );
}
