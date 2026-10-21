import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "@/components/logo";
import { telHref } from "@/lib/utils";
import { LanguageLinks } from "./language-links";

export async function SiteFooter() {
  const t = await getTranslations("public");
  const a = siteConfig.address;
  return (
    <footer className="border-t border-line bg-canvas pb-24 text-sm text-zinc-500 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[2fr_1fr_1.3fr] md:px-8">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs">{t("footer.tagline")}</p>
          <LanguageLinks />
        </div>
        <div>
          <h2 className="mb-3 font-bold text-ink">{t("footer.quickLinks")}</h2>
          <ul className="space-y-2">
            <li><Link href="/availability" className="hover:text-ink">{t("nav.availability")}</Link></li>
            <li><Link href="/pickleball-court-nadiad" className="hover:text-ink">{t("nav.pickleball")}</Link></li>
            <li><Link href="/cricket-football-turf-nadiad" className="hover:text-ink">{t("nav.turf")}</Link></li>
            <li><Link href="/contact" className="hover:text-ink">{t("nav.contact")}</Link></li>
            <li><NextLink href="/staff" prefetch={false} rel="nofollow" className="hover:text-ink">{t("nav.staff")}</NextLink></li>
          </ul>
        </div>
        <address className="space-y-2.5 not-italic">
          <h2 className="mb-3 font-bold text-ink">{t("contact.title")}</h2>
          {siteConfig.contact.phones.map((p) => (
            <a key={p.number} href={telHref(p.number)} className="flex items-center gap-2 hover:text-ink">
              <Phone className="size-4 text-brand-700" /> {p.name}: +91 {p.number}
            </a>
          ))}
          <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-2 break-all hover:text-ink">
            <Mail className="size-4 shrink-0 text-brand-700" /> {siteConfig.contact.email}
          </a>
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" /> {a.street}, {a.locality}, {a.region} {a.postalCode}</p>
          {siteConfig.social.instagram && (
            <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="block hover:text-ink">Instagram</a>
          )}
        </address>
      </div>
      <p className="border-t border-line py-5 text-center">{t("footer.rights", { year: new Date().getFullYear() })}</p>
    </footer>
  );
}
