import { getTranslations } from "next-intl/server";
import { CalendarSearch, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { telHref, whatsappHref } from "@/lib/utils";

/** Always-visible bottom bar on phones: Call · WhatsApp · Free slots. */
export async function MobileCTA() {
  const t = await getTranslations("public.cta");
  const item = "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold";
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
      <div className="flex">
        <a href={telHref(siteConfig.contact.phones[0].number)} className={`${item} text-brand-900`}>
          <Phone className="size-5" /> {t("call")}
        </a>
        <a href={whatsappHref(t("whatsappGeneral"), siteConfig.contact.whatsapp)} target="_blank" rel="noopener noreferrer" className={`${item} text-[#128c4a]`}>
          <WhatsAppIcon className="size-5" /> {t("whatsapp")}
        </a>
        <Link href="/availability" className={`${item} text-brand-900`}>
          <CalendarSearch className="size-5" /> {t("slots")}
        </Link>
      </div>
    </div>
  );
}
