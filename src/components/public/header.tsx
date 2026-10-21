"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Wordmark } from "@/components/logo";
import { buttonClass } from "@/components/ui/button";
import { LanguageLinks } from "./language-links";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslations("public.nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/availability", label: t("availability") },
    { href: "/#courts", label: t("courts") },
    { href: "/#gallery", label: t("gallery") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-lg focus:bg-white focus:p-2">{t("skip")}</a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" aria-label="SSquare home"><Wordmark /></Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] font-semibold text-ink-2 lg:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className="hover:text-brand-700">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageLinks className="hidden md:flex" />
          <Link href="/availability" className={buttonClass("primary", "sm", "hidden sm:inline-flex")}>{t("book")}</Link>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={t("menu")}
            className="grid size-10 place-items-center rounded-xl border border-line bg-white text-ink lg:hidden">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <div id="mobile-menu" className={cn("border-t border-line bg-canvas px-4 pb-5 lg:hidden", open ? "block" : "hidden")}>
        <nav aria-label="Mobile" className="flex flex-col py-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-xl px-2 py-3 text-base font-semibold text-ink active:bg-soft">{l.label}</Link>
          ))}
        </nav>
        <LanguageLinks className="px-2" />
      </div>
    </header>
  );
}
