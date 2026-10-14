import { getTranslations } from "next-intl/server";
import { MapPin, Navigation } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/public/section";

export async function Location() {
  const t = await getTranslations("public.location");
  const a = siteConfig.address;
  return (
    <Section id="location" title={t("title")}>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-3xl ring-1 ring-zinc-200">
          <iframe src={siteConfig.maps.embedUrl} title={t("mapTitle")} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="aspect-[4/3] w-full md:aspect-[16/9]" allowFullScreen />
        </div>
        <div className="space-y-4">
          <p className="flex items-start gap-3 text-lg">
            <MapPin className="mt-1 size-5 shrink-0 text-brand-700" />
            <span>{siteConfig.legalName}<br />{a.street}<br />{a.locality}, {a.region} {a.postalCode}</span>
          </p>
          <a href={siteConfig.maps.directionsUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg", "w-full")}>
            <Navigation className="size-5" /> {t("directions")}
          </a>
        </div>
      </div>
    </Section>
  );
}
