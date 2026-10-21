"use client";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { qk } from "@/lib/query-keys";
import type { SportRate } from "@/lib/pricing";
import type { Court, Profile } from "@/lib/types";
import type { Locale } from "@/i18n/routing";
import { COURTS } from "@/config/business";
import { customerLabel, phoneLabel } from "@/lib/customer";

export function useProfiles() {
  return useQuery({
    queryKey: qk.profiles,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("profiles")
        .select("id, username, display_name, role, permissions, locale, is_active")
        .order("role")
        .order("display_name");
      if (error) throw error;
      return data as Profile[];
    },
  });
}

/** id → display name (falls back to "—"). */
export function useNameOf() {
  const { data } = useProfiles();
  return (id: string | null | undefined) => data?.find((p) => p.id === id)?.display_name ?? "—";
}

export function useCourts() {
  return useQuery({
    queryKey: qk.courts,
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await getSupabase().from("courts").select("*").eq("is_active", true).order("sort");
      if (error) throw error;
      return data as Court[];
    },
  });
}

/** Court display name: from the database if set, otherwise from the translation files. */
export function useCourtName() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.courts");
  const { data } = useCourts();
  return (slug: string) => {
    const c = data?.find((x) => x.slug === slug);
    return c?.name_i18n[locale] ?? (t.has(slug) ? t(slug) : c?.name_i18n.en ?? slug);
  };
}

/** Display helpers for optional customer details ("Unknown customer" / "Not given"). */
export function useCustomerLabels() {
  const t = useTranslations("common");
  return {
    name: (name: string | null | undefined) => customerLabel(name, t("unknownCustomer")),
    phone: (phone: string | null | undefined) => phoneLabel(phone, t("unknownPhone")),
  };
}

/** Courts offered (from config), so pickers always show every court even before the DB loads. */
export function useCourtOptions() {
  const courtName = useCourtName();
  return COURTS.map((slug) => ({ value: slug, label: courtName(slug) }));
}

export function useRates() {
  return useQuery({
    queryKey: qk.rates,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("sport_rates")
        .select("sport, court_slug, weekday_price, weekend_price, sort")
        .order("sort");
      if (error) throw error;
      return data as SportRate[];
    },
  });
}
