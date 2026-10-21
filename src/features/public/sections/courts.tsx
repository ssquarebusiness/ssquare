import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { COURT_SPORTS, type CourtSlug, type Sport } from "@/config/business";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/public/section";
import { formatINR } from "@/lib/money";
import { getPublicData } from "@/lib/public-data";
import { SportIcon } from "./sport-icon";

const COURT_OF: Record<Sport, CourtSlug> = { cricket: "turf", football: "turf", pickleball: "pickleball" };

/** Pricing: one card per sport with weekday / weekend hourly rates, then facilities. */
export async function Courts({ only }: { only?: CourtSlug }) {
  const t = await getTranslations("public");
  const tSports = await getTranslations("common.sports");
  const { rates } = await getPublicData();
  const sports = (Object.keys(COURT_OF) as Sport[]).filter((s) => !only || COURT_SPORTS[only].includes(s));

  return (
    <Section id="courts" kicker={t("courts.kicker")} title={t("courts.title")} subtitle={t("courts.subtitle")}>
      <div className="grid gap-4 md:grid-cols-3">
        {sports.map((sport) => {
          const r = rates.find((x) => x.sport === sport);
          return (
            <article key={sport} className="flex flex-col rounded-[20px] border border-line bg-white p-5 shadow-card md:p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><SportIcon sport={sport} /></span>
              <h3 className="mt-3.5 text-[19px] font-bold text-ink">
                {tSports(sport)}
                {sport === "pickleball" && (
                  <span className="ml-2 rounded-full bg-gold-50 px-2 py-0.5 align-[2px] text-[11.5px] font-bold text-gold-800">{t("courts.onlyBadge")}</span>
                )}
              </h3>
              <p className="mt-1 text-[14.5px] text-zinc-500">{t(`courts.sportText.${sport}`)}</p>
              <div className="mt-4 flex-1 space-y-2.5">
                {r ? (
                  (["weekday", "weekend"] as const).map((k) => (
                    <div key={k} className="flex items-baseline justify-between border-t border-dashed border-line pt-2.5">
                      <span className="text-sm text-ink-2">{t(`courts.dayTypesLong.${k}`)}</span>
                      <b className="text-[22px] tracking-tight text-ink">
                        {formatINR(k === "weekday" ? r.weekday_price : r.weekend_price)}
                        <small className="ml-1 text-[13px] font-medium text-zinc-500">{t("courts.perHour")}</small>
                      </b>
                    </div>
                  ))
                ) : (
                  <p className="border-t border-dashed border-line pt-2.5 text-sm text-zinc-500">{t("courts.noRates")}</p>
                )}
              </div>
              <Link href={{ pathname: "/availability", query: { court: COURT_OF[sport] } }}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-ink">
                {t("courts.seeSlots")} <ArrowRight className="size-4" />
              </Link>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-[13px] text-zinc-500">{t("courts.ratesNote")}</p>

      <h3 className="mt-10 mb-3 text-sm font-bold tracking-[0.1em] text-brand-700 uppercase">{t("amenities.title")}</h3>
      <ul className="flex flex-wrap gap-2">
        {siteConfig.amenities.map((a) => (
          <li key={a} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink-2">
            <Check className="size-4 text-brand-600" /> {t(`amenities.${a}`)}
          </li>
        ))}
      </ul>
    </Section>
  );
}
