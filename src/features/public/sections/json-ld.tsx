import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { absoluteUrl, localePath } from "@/lib/seo";
import { FAQ_KEYS } from "./faq";

function Script({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Local business structured data (helps "turf near me" / Google Maps results). */
export async function BusinessJsonLd({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "public.meta" });
  const a = siteConfig.address;
  const sameAs = Object.values(siteConfig.social).filter(Boolean);
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": ["SportsActivityLocation", "LocalBusiness"],
        "@id": absoluteUrl("/#business"),
        name: siteConfig.legalName,
        alternateName: siteConfig.name,
        description: t("homeDescription"),
        url: absoluteUrl(localePath(locale, "/")),
        image: [absoluteUrl("/images/logo.webp"), absoluteUrl(siteConfig.heroImage)],
        logo: absoluteUrl("/images/logo.webp"),
        telephone: `+${siteConfig.contact.countryCode}${siteConfig.contact.phones[0].number}`,
        email: siteConfig.contact.email,
        priceRange: "₹₹",
        address: { "@type": "PostalAddress", streetAddress: a.street, addressLocality: a.locality, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country },
        geo: { "@type": "GeoCoordinates", latitude: siteConfig.geo.lat, longitude: siteConfig.geo.lng },
        hasMap: siteConfig.maps.directionsUrl,
        openingHoursSpecification: [{
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        }],
        amenityFeature: siteConfig.amenities.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
        ...(sameAs.length ? { sameAs } : {}),
      }}
    />
  );
}

export async function FaqJsonLd({ locale, keys = FAQ_KEYS }: { locale: Locale; keys?: readonly (typeof FAQ_KEYS)[number][] }) {
  const t = await getTranslations({ locale, namespace: "public.faq" });
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: keys.map((k) => ({
          "@type": "Question",
          name: t(`items.${k}.q`),
          acceptedAnswer: { "@type": "Answer", text: t(`items.${k}.a`) },
        })),
      }}
    />
  );
}
