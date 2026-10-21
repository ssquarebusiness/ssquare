import "server-only";
import { cache } from "react";
import { COURTS, type CourtSlug } from "@/config/business";
import type { Locale } from "@/i18n/routing";
import type { SportRate } from "@/lib/pricing";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/server";
import type { Court } from "@/lib/types";


const FALLBACK_NAMES: Record<CourtSlug, Record<Locale, string>> = {
  turf: { en: "Turf (Cricket & Football)", gu: "ટર્ફ (ક્રિકેટ અને ફૂટબોલ)", hi: "टर्फ (क्रिकेट और फ़ुटबॉल)" },
  pickleball: { en: "Pickleball Court", gu: "પિકલબોલ કોર્ટ", hi: "पिकलबॉल कोर्ट" },
};

/** Courts + rates for public pages. Works (with fallbacks) even before Supabase is configured. */
export const getPublicData = cache(async () => {
  if (!hasSupabaseConfig()) return { courts: [] as Court[], rates: [] as SportRate[] };
  const supabase = createPublicClient();
  const [courts, rates] = await Promise.all([
    supabase.from("courts").select("*").eq("is_active", true).order("sort"),
    supabase.from("sport_rates").select("sport, court_slug, weekday_price, weekend_price, sort").order("sort"),
  ]);
  return { courts: (courts.data ?? []) as Court[], rates: (rates.data ?? []) as SportRate[] };
});

export async function getCourtNames(locale: Locale): Promise<Record<CourtSlug, string>> {
  const { courts } = await getPublicData();
  return Object.fromEntries(
    COURTS.map((c) => [c, courts.find((x) => x.slug === c)?.name_i18n[locale] ?? FALLBACK_NAMES[c][locale]]),
  ) as Record<CourtSlug, string>;
}
