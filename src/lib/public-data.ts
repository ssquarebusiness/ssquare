import "server-only";
import { cache } from "react";
import { COURTS, type CourtSlug } from "@/config/business";
import type { Locale } from "@/i18n/routing";
import type { RateRule } from "@/lib/pricing";
import { createPublicClient } from "@/lib/supabase/server";
import type { Court } from "@/lib/types";

const hasSupabase = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const FALLBACK_NAMES: Record<CourtSlug, Record<Locale, string>> = {
  turf: { en: "Turf (Cricket & Football)", gu: "ટર્ફ (ક્રિકેટ અને ફૂટબોલ)", hi: "टर्फ (क्रिकेट और फ़ुटबॉल)" },
  pickleball: { en: "Pickleball Court", gu: "પિકલબોલ કોર્ટ", hi: "पिकलबॉल कोर्ट" },
};

/** Courts + rates for public pages. Works (with fallbacks) even before Supabase is configured. */
export const getPublicData = cache(async () => {
  if (!hasSupabase()) return { courts: [] as Court[], rates: [] as RateRule[] };
  const supabase = createPublicClient();
  const [courts, rates] = await Promise.all([
    supabase.from("courts").select("*").eq("is_active", true).order("sort"),
    supabase.from("rate_rules").select("court_slug, day_type, start_minute, end_minute, price_per_hour").order("start_minute"),
  ]);
  return { courts: (courts.data ?? []) as Court[], rates: (rates.data ?? []) as RateRule[] };
});

export async function getCourtNames(locale: Locale): Promise<Record<CourtSlug, string>> {
  const { courts } = await getPublicData();
  return Object.fromEntries(
    COURTS.map((c) => [c, courts.find((x) => x.slug === c)?.name_i18n[locale] ?? FALLBACK_NAMES[c][locale]]),
  ) as Record<CourtSlug, string>;
}
