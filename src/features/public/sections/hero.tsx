import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Clock, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";
import { FullLogo } from "@/components/logo";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { whatsappHref } from "@/lib/utils";

export async function Hero() {
  const t = await getTranslations("public");
  return (
    <section className="bg-brand-950 relative isolate overflow-hidden text-white">
      <Image
        src={siteConfig.heroImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-50"
        unoptimized={siteConfig.heroImage.endsWith(".svg")}
      />
      <div className="from-brand-950 via-brand-950/70 to-brand-950/30 absolute inset-0 -z-10 bg-gradient-to-t" />
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-8 pb-14 md:grid-cols-[1fr_auto] md:pt-24 md:pb-24">
        {/* Logo: compact badge above the text on phones, large beside it on bigger screens. */}
        <FullLogo
          priority
          sizes="(min-width: 768px) 380px, 176px"
          className="mx-auto w-44 shadow-2xl ring-1 shadow-black/50 ring-white/10 md:order-2 md:w-[380px]"
        />
        <div className="md:order-1">
          <p className="bg-ball-400 text-brand-950 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold">
            <Sparkles className="size-4" /> {t("hero.badge")}
          </p>
          <h1 className="font-display mt-5 max-w-3xl text-4xl leading-tight font-bold md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="text-brand-100 mt-4 max-w-2xl text-lg md:text-xl">{t("hero.subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/availability" className={buttonClass("accent", "xl")}>
              {t("hero.checkSlots")}
            </Link>
            <a
              href={whatsappHref(t("cta.whatsappGeneral"), siteConfig.contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("whatsapp", "xl")}
            >
              <WhatsAppIcon className="size-6" /> {t("hero.whatsapp")}
            </a>
          </div>
          <ul className="text-brand-100 mt-8 flex flex-wrap gap-x-6 gap-y-2">
            <li className="flex items-center gap-2">
              <Clock className="text-ball-400 size-5" /> {t("hero.points.open")}
            </li>
            <li className="flex items-center gap-2">
              <Lightbulb className="text-ball-400 size-5" /> {t("hero.points.lights")}
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="text-ball-400 size-5" /> {t("hero.points.family")}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
