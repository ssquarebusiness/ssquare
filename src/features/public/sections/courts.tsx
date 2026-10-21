import { getLocale, getTranslations } from "next-intl/server";
import { Car, Check, Cctv, Clock, Droplets, Lightbulb, Package, Armchair, Bath } from "lucide-react";
import { COURTS } from "@/config/business";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/public/section";
import { formatINR } from "@/lib/money";
import { getCourtNames, getPublicData } from "@/lib/public-data";
import { formatMinutes } from "@/lib/time";

const AMENITY_ICONS = { lights: Lightbulb, parking: Car, water: Droplets, washroom: Bath, seating: Armchair, equipment: Package, cctv: Cctv, open24: Clock } as const;
const LANDING = { turf: "/cricket-football-turf-nadiad", pickleball: "/pickleball-court-nadiad" } as const;

export async function Courts() {
  const t = await getTranslations("public");
  const locale = (await getLocale()) as Locale;
  const { rates } = await getPublicData();
  const names = await getCourtNames(locale);

  return (
    <Section id="courts" title={t("courts.title")} subtitle={t("courts.subtitle")} tone="soft">
      <div className="grid gap-5 md:grid-cols-2">
        {COURTS.map((court) => {
          const rules = rates.filter((r) => r.court_slug === court);
          return (
            <article key={court} className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-2xl font-bold text-brand-950">{names[court]}</h3>
              <p className="mt-2 text-zinc-600">{t(`courts.${court}.text`)}</p>
              <ul className="mt-5 space-y-2">
                {rules.length === 0 && <li className="text-zinc-500">{t("courts.noRates")}</li>}
                {rules.map((r, i) => (
                  <li key={i} className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3">
                    <span>
                      <span className="block font-semibold text-brand-950">
                        {formatMinutes(r.start_minute, locale)} – {formatMinutes(r.end_minute % 1440, locale)}
                      </span>
                      <span className="text-sm text-zinc-500">{t(`courts.dayTypes.${r.day_type}`)}</span>
                    </span>
                    <span className="text-xl font-bold text-brand-800">
                      {formatINR(r.price_per_hour)}<span className="text-sm font-medium text-zinc-500"> {t("courts.perHour")}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href={{ pathname: "/availability", query: { court } }} className={buttonClass("primary", "md")}>{t("courts.seeSlots")}</Link>
                <Link href={LANDING[court]} className={buttonClass("outline", "md")}>{t("courts.learnMore")}</Link>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-sm text-zinc-500">{t("courts.ratesNote")}</p>

      <h3 className="mt-12 mb-4 text-xl font-bold text-brand-950">{t("amenities.title")}</h3>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {siteConfig.amenities.map((a) => {
          const Icon = AMENITY_ICONS[a as keyof typeof AMENITY_ICONS] ?? Check;
          return (
            <li key={a} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
              <Icon className="size-5 shrink-0 text-brand-700" /> <span className="font-medium">{t(`amenities.${a}`)}</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
