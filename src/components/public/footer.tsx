import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
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
    <footer className="bg-brand-950 pb-24 text-brand-100 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Wordmark dark />
          <p className="text-brand-200">{t("footer.tagline")}</p>
          <LanguageLinks dark />
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-white">{t("footer.quickLinks")}</h2>
          <ul className="space-y-2">
            <li><Link href="/availability" className="hover:text-white">{t("nav.availability")}</Link></li>
            <li><Link href="/pickleball-court-nadiad" className="hover:text-white">{t("nav.pickleball")}</Link></li>
            <li><Link href="/cricket-football-turf-nadiad" className="hover:text-white">{t("nav.turf")}</Link></li>
            <li><Link href="/contact" className="hover:text-white">{t("nav.contact")}</Link></li>
            <li><NextLink href="/staff" prefetch={false} rel="nofollow" className="text-brand-300 hover:text-white">{t("nav.staff")}</NextLink></li>
          </ul>
        </div>
        <address className="space-y-2 not-italic">
          <h2 className="mb-3 font-semibold text-white">{t("contact.title")}</h2>
          {siteConfig.contact.phones.map((p) => (
            <a key={p.number} href={telHref(p.number)} className="flex items-center gap-2 hover:text-white">
              <Phone className="size-4" /> {p.name}: +91 {p.number}
            </a>
          ))}
          <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-2 hover:text-white"><Mail className="size-4" /> {siteConfig.contact.email}</a>
          <p className="flex items-start gap-2"><MapPin className="mt-1 size-4 shrink-0" /> {a.street}, {a.locality}, {a.region} {a.postalCode}</p>
          {siteConfig.social.instagram && (
            <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
              <InstagramIcon /> Instagram
            </a>
          )}
        </address>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-sm text-brand-300">
        {t("footer.rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
