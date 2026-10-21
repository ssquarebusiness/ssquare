import { getTranslations } from "next-intl/server";
import { Clock, Mail, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buttonClass } from "@/components/ui/button";
import { Section } from "@/components/public/section";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { telHref, whatsappHref } from "@/lib/utils";

export async function Contact({ asH1 }: { asH1?: boolean }) {
  const t = await getTranslations("public");
  return (
    <Section id="contact" headingAs={asH1 ? "h1" : "h2"} kicker={t("contact.kicker")} title={t("contact.title")} subtitle={t("contact.subtitle")}>
      <div className="grid gap-4 md:grid-cols-3">
        {siteConfig.contact.phones.map((p) => (
          <div key={p.number} className="rounded-[20px] border border-line bg-white p-5 shadow-card">
            <p className="text-[13px] font-bold tracking-wide text-zinc-500 uppercase">{t("contact.owners")}</p>
            <p className="mt-1 text-lg font-bold text-ink">{p.name}</p>
            <p className="text-ink-2">+91 {p.number}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={telHref(p.number)} className={buttonClass("primary", "md")}><Phone className="size-4" /> {t("cta.call")}</a>
              <a href={whatsappHref(t("cta.whatsappGeneral"), p.number)} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "md")}>
                <WhatsAppIcon className="size-4 text-[#1d7a46]" /> {t("cta.whatsapp")}
              </a>
            </div>
          </div>
        ))}
        <div className="space-y-4 rounded-[20px] border border-line bg-white p-5 shadow-card">
          <p className="flex gap-3 text-ink-2"><Clock className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <span><b className="block text-ink">{t("contact.hours")}</b>{t("contact.hoursValue")}</span></p>
          <p className="flex gap-3 text-ink-2"><Mail className="mt-0.5 size-5 shrink-0 text-brand-700" />
            <a href={`mailto:${siteConfig.contact.email}`} className="break-all hover:text-ink">{siteConfig.contact.email}</a></p>
        </div>
      </div>
    </Section>
  );
}
