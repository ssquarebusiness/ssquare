import { getTranslations } from "next-intl/server";
import { CalendarDays, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { telHref, whatsappHref } from "@/lib/utils";

/** Always-visible bottom bar on phones: Call · WhatsApp · Availability. */
export async function MobileCTA() {
  const t = await getTranslations("public.cta");
  const item = "flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold";
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 pt-2.5 backdrop-blur md:hidden">
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
        <a href={telHref(siteConfig.contact.phones[0].number)} className={`${item} border border-line text-ink`}>
          <Phone className="size-4" /> {t("call")}
        </a>
        <a href={whatsappHref(t("whatsappGeneral"), siteConfig.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className={`${item} border border-line text-ink`}>
          <WhatsAppIcon className="size-4 text-[#1d7a46]" /> {t("whatsapp")}
        </a>
        <Link href="/availability" className={`${item} bg-ink text-white`}>
          <CalendarDays className="size-4" /> {t("slots")}
        </Link>
      </div>
    </div>
  );
}
