"use client";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { qk } from "@/lib/query-keys";
import type { RateRule } from "@/lib/pricing";
import type { Court, Profile } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

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

export function useCourtName() {
  const locale = useLocale() as Locale;
  const { data } = useCourts();
  return (slug: string) => {
    const c = data?.find((x) => x.slug === slug);
    return c?.name_i18n[locale] ?? c?.name_i18n.en ?? slug;
  };
}

export function useRates() {
  return useQuery({
    queryKey: qk.rates,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("rate_rules")
        .select("id, court_slug, day_type, start_minute, end_minute, price_per_hour")
        .order("court_slug")
        .order("start_minute");
      if (error) throw error;
      return data as (RateRule & { id: string })[];
    },
  });
}
