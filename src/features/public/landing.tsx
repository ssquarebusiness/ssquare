import { getTranslations } from "next-intl/server";
import { CalendarDays, Check } from "lucide-react";
import type { CourtSlug } from "@/config/business";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { FullLogo } from "@/components/logo";
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
      <section className="bg-canvas">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-9 pb-12 md:grid-cols-[1.3fr_0.7fr] md:px-8 md:pt-16 md:pb-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-700">
              <span className="size-1.5 rounded-full bg-brand-500" /> {t("hero.points.open")}
            </p>
            <h1 className="mt-4 text-[32px] leading-[1.1] font-extrabold tracking-tight text-ink md:text-[48px]">{t(`landing.${court}.h1`)}</h1>
            <p className="mt-4 max-w-2xl text-[17px] text-ink-2">{t(`landing.${court}.intro`)}</p>
            <ul className="mt-6 grid max-w-2xl gap-2.5 sm:grid-cols-2">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-ink-2">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><Check className="size-3.5" /></span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-7 grid gap-2.5 sm:flex">
              <a href="#availability" className={buttonClass("primary", "lg")}><CalendarDays className="size-5" /> {t("hero.checkSlots")}</a>
              <a href={whatsappHref(t("cta.whatsappGeneral"), siteConfig.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "lg")}>
                <WhatsAppIcon className="size-5 text-[#1d7a46]" /> {t("hero.whatsapp")}
              </a>
            </div>
          </div>
          <div className="hidden rounded-[26px] bg-white p-2 shadow-card md:block">
            <FullLogo priority sizes="320px" className="w-full rounded-[20px]" />
          </div>
        </div>
      </section>
      <section className="border-y border-line bg-white py-12">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">{t(`landing.${court}.whatTitle`)}</h2>
          <p className="mt-3 text-lg text-ink-2">{t(`landing.${court}.what`)}</p>
        </div>
      </section>
      <AvailabilitySection court={court} />
      <Courts only={court} />
      <Reviews />
      <Location />
      <Faq keys={faq} />
      <FaqJsonLd locale={locale} keys={faq} />
    </>
  );
}
