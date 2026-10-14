import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Clock, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { whatsappHref } from "@/lib/utils";

export async function Hero() {
  const t = await getTranslations("public");
  return (
    <section className="relative isolate overflow-hidden bg-brand-950 text-white">
      <Image src={siteConfig.heroImage} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-50"
        unoptimized={siteConfig.heroImage.endsWith(".svg")} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950 via-brand-950/70 to-brand-950/30" />
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-14 md:pt-28 md:pb-24">
        <p className="inline-flex items-center gap-2 rounded-full bg-ball-400 px-3.5 py-1.5 text-sm font-bold text-brand-950">
          <Sparkles className="size-4" /> {t("hero.badge")}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight font-bold md:text-6xl">{t("hero.title")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-brand-100 md:text-xl">{t("hero.subtitle")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/availability" className={buttonClass("accent", "xl")}>{t("hero.checkSlots")}</Link>
          <a href={whatsappHref(t("cta.whatsappGeneral"), siteConfig.contact.whatsapp)} target="_blank" rel="noopener noreferrer"
            className={buttonClass("whatsapp", "xl")}>
            <WhatsAppIcon className="size-6" /> {t("hero.whatsapp")}
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-brand-100">
          <li className="flex items-center gap-2"><Clock className="size-5 text-ball-400" /> {t("hero.points.open")}</li>
          <li className="flex items-center gap-2"><Lightbulb className="size-5 text-ball-400" /> {t("hero.points.lights")}</li>
          <li className="flex items-center gap-2"><ShieldCheck className="size-5 text-ball-400" /> {t("hero.points.family")}</li>
        </ul>
      </div>
    </section>
  );
}
