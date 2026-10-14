import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import type { CourtSlug } from "@/config/business";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { whatsappHref } from "@/lib/utils";
import { AvailabilitySection } from "./sections/availability";
import { Courts } from "./sections/courts";
import { Faq, FAQ_KEYS } from "./sections/faq";
import { FaqJsonLd } from "./sections/json-ld";
import { Location } from "./sections/location";
import { Reviews } from "./sections/reviews";

/** SEO landing page for one court ("pickleball court in Nadiad", "box cricket turf Nadiad"). */
export async function CourtLanding({ court, locale, faq }: { court: CourtSlug; locale: Locale; faq: readonly (typeof FAQ_KEYS)[number][] }) {
  const t = await getTranslations("public");
  const points = t.raw(`landing.${court}.points`) as string[];
  return (
    <>
      <section className="bg-gradient-to-b from-brand-950 to-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h1 className="max-w-3xl font-display text-4xl leading-tight font-bold md:text-5xl">{t(`landing.${court}.h1`)}</h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">{t(`landing.${court}.intro`)}</p>
          <ul className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ball-400" /> {p}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#availability" className={buttonClass("accent", "xl")}>{t("hero.checkSlots")}</a>
            <a href={whatsappHref(t("cta.whatsappGeneral"), siteConfig.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "xl")}>
              <WhatsAppIcon className="size-6" /> {t("hero.whatsapp")}
            </a>
          </div>
        </div>
      </section>
      <section className="bg-white py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-2xl font-bold text-brand-950">{t(`landing.${court}.whatTitle`)}</h2>
          <p className="mt-3 text-lg text-zinc-700">{t(`landing.${court}.what`)}</p>
        </div>
      </section>
      <AvailabilitySection court={court} />
      <Courts />
      <Reviews />
      <Location />
      <Faq keys={faq} />
      <FaqJsonLd locale={locale} keys={faq} />
    </>
  );
}
