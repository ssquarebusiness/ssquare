import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, Clock, ShieldCheck, Star, Sun } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { FullLogo } from "@/components/logo";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { getGoogleReviews } from "@/lib/google-reviews";
import { whatsappHref } from "@/lib/utils";

/** Clean Sage hero: headline left; arena photo with logo tile and Google rating right. */
export async function Hero() {
  const t = await getTranslations("public");
  const locale = (await getLocale()) as Locale;
  const reviews = await getGoogleReviews(locale);

  return (
    <section className="bg-canvas">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-9 pb-12 md:grid-cols-2 md:gap-14 md:px-8 md:pt-16 md:pb-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-700">
            <span className="size-1.5 rounded-full bg-brand-500" /> {t("hero.badge")}
          </p>
          <h1 className="mt-4 text-[34px] leading-[1.08] font-extrabold tracking-tight text-ink md:text-[52px]">
            {t("hero.titleMain")} <span className="text-brand-600">{t("hero.titleSoft")}</span>
          </h1>
          <p className="mt-4 max-w-xl text-[17px] text-ink-2">{t("hero.subtitle")}</p>
          <div className="mt-6 grid gap-2.5 sm:flex">
            <Link href="/availability" className={buttonClass("primary", "lg")}>
              <CalendarDays className="size-5" /> {t("hero.checkSlots")}
            </Link>
            <a href={whatsappHref(t("cta.whatsappGeneral"), siteConfig.contact.whatsapp)} target="_blank" rel="noopener noreferrer"
              className={buttonClass("outline", "lg")}>
              <WhatsAppIcon className="size-5 text-[#1d7a46]" /> {t("hero.whatsapp")}
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-2">
            <li className="flex items-center gap-1.5"><Clock className="size-[18px] text-brand-600" /> {t("hero.points.open")}</li>
            <li className="flex items-center gap-1.5"><Sun className="size-[18px] text-brand-600" /> {t("hero.points.lights")}</li>
            <li className="flex items-center gap-1.5"><ShieldCheck className="size-[18px] text-brand-600" /> {t("hero.points.family")}</li>
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
            <Image src={siteConfig.heroImage} alt={t("gallery.alt.turfNight")} fill priority sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover" unoptimized={siteConfig.heroImage.endsWith(".svg")} />
          </div>
          {reviews && reviews.count > 0 && (
            <p className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-[13px] font-bold text-ink shadow-card">
              <Star className="size-4 fill-gold text-gold" /> {t("reviews.ratingChip", { rating: reviews.rating.toFixed(1) })}
            </p>
          )}
          <div className="absolute -bottom-5 left-4 w-28 rounded-[22px] bg-white p-1.5 shadow-card md:-bottom-7 md:-left-6 md:w-36">
            <FullLogo priority sizes="144px" className="w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
