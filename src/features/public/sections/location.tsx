import { getTranslations } from "next-intl/server";
import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/public/section";
import { telHref } from "@/lib/utils";

/** Visit: map + an info card with address, hours, phones and directions. */
export async function Location() {
  const t = await getTranslations("public");
  const a = siteConfig.address;
  return (
    <Section id="location" kicker={t("location.kicker")} title={t("location.title")}>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-[20px] border border-line bg-soft">
          <iframe src={siteConfig.maps.embedUrl} title={t("location.mapTitle")} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="block aspect-[4/3] h-full min-h-60 w-full md:aspect-auto" allowFullScreen />
        </div>
        <div className="grid content-start gap-4 rounded-[20px] border border-line bg-white p-5 md:p-6">
          <p className="flex gap-3 text-ink-2">
            <MapPin className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <span><b className="text-ink">{siteConfig.legalName}</b><br />{a.street}<br />{a.locality}, {a.region} {a.postalCode}</span>
          </p>
          <p className="flex gap-3 text-ink-2"><Clock className="mt-0.5 size-5 shrink-0 text-brand-700" /> {t("contact.hoursValue")}</p>
          {siteConfig.contact.phones.map((p) => (
            <a key={p.number} href={telHref(p.number)} className="flex gap-3 text-ink-2 hover:text-ink">
              <Phone className="mt-0.5 size-5 shrink-0 text-brand-700" /> {p.name} · +91 {p.number}
            </a>
          ))}
          <a href={siteConfig.maps.directionsUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg", "w-full")}>
            <Navigation className="size-5" /> {t("location.directions")}
          </a>
        </div>
      </div>
    </Section>
  );
}
