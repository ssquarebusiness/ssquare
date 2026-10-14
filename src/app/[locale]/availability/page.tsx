import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { AvailabilitySection } from "@/features/public/sections/availability";
import { Courts } from "@/features/public/sections/courts";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.meta" });
  return pageMetadata({ locale, path: "/availability", title: t("availabilityTitle"), description: t("availabilityDescription") });
}

export default async function AvailabilityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <AvailabilitySection headingLevel="h1" />
      <Courts />
    </>
  );
}
