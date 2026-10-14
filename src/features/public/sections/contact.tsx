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
    <Section id="contact" headingAs={asH1 ? "h1" : "h2"} title={t("contact.title")} subtitle={t("contact.subtitle")}>
      <div className="grid gap-4 md:grid-cols-3">
        {siteConfig.contact.phones.map((p) => (
          <div key={p.number} className="rounded-3xl border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">{t("contact.owners")}</p>
            <p className="text-lg font-bold">{p.name}</p>
            <p className="text-zinc-700">+91 {p.number}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={telHref(p.number)} className={buttonClass("outline", "md")}><Phone className="size-4" /> {t("cta.call")}</a>
              <a href={whatsappHref(t("cta.whatsappGeneral"), p.number)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "md")}>
                <WhatsAppIcon className="size-4" /> {t("cta.whatsapp")}
              </a>
            </div>
          </div>
        ))}
        <div className="space-y-3 rounded-3xl border border-zinc-200 p-5">
          <p className="flex items-center gap-2"><Clock className="size-5 text-brand-700" /> <span><span className="block text-sm text-zinc-500">{t("contact.hours")}</span>{t("contact.hoursValue")}</span></p>
          <p className="flex items-center gap-2"><Mail className="size-5 text-brand-700" />
            <a href={`mailto:${siteConfig.contact.email}`} className="break-all underline-offset-2 hover:underline">{siteConfig.contact.email}</a></p>
        </div>
      </div>
    </Section>
  );
}
