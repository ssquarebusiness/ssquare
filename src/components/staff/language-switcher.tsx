"use client";
import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { localeNames, locales } from "@/i18n/routing";
import { setStaffLocaleAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ dark }: { dark?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <label className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
      dark ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-800", pending && "opacity-60")}>
      <Languages className="size-4" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => start(async () => { await setStaffLocaleAction(e.target.value); router.refresh(); })}
        className="cursor-pointer bg-transparent outline-none [&>option]:text-zinc-900"
      >
        {locales.map((l) => <option key={l} value={l}>{localeNames[l]}</option>)}
      </select>
    </label>
  );
}
