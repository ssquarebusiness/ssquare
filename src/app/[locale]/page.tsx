import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/features/public/sections/hero";
import { AvailabilitySection } from "@/features/public/sections/availability";
import { Why } from "@/features/public/sections/why";
import { Courts } from "@/features/public/sections/courts";
import { Gallery } from "@/features/public/sections/gallery";
import { Reviews } from "@/features/public/sections/reviews";
import { Location } from "@/features/public/sections/location";
import { Faq } from "@/features/public/sections/faq";
import { FaqJsonLd } from "@/features/public/sections/json-ld";

// Rates and Google reviews are refreshed in the background (rates also refresh instantly when owners save them).
export const revalidate = 3600;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.meta" });
  return pageMetadata({ locale, path: "/", title: t("homeTitle"), description: t("homeDescription") });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero />
      <AvailabilitySection />
      <Why />
      <Courts />
      <Gallery />
      <Reviews />
      <Location />
      <Faq />
      <FaqJsonLd locale={locale} />
    </>
  );
}
