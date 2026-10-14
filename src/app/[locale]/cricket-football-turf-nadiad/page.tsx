import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { CourtLanding } from "@/features/public/landing";

export const revalidate = 3600;
type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.meta" });
  return pageMetadata({ locale, path: "/cricket-football-turf-nadiad", title: t("turfTitle"), description: t("turfDescription") });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CourtLanding court="turf" locale={locale} faq={["hours", "sports", "book", "duration", "payment", "cancel"]} />;
}
