import { getLocale, getTranslations } from "next-intl/server";
import type { CourtSlug } from "@/config/business";
import type { Locale } from "@/i18n/routing";
import { getCourtNames } from "@/lib/public-data";
import { Section } from "@/components/public/section";
import { AvailabilityWidget } from "../availability-widget";

export async function AvailabilitySection({ court, headingLevel = "h2" }: { court?: CourtSlug; headingLevel?: "h1" | "h2" }) {
  const t = await getTranslations("public.availability");
  const locale = (await getLocale()) as Locale;
  const names = await getCourtNames(locale);
  return (
    <Section id="availability" tone="soft" split headingAs={headingLevel} kicker={t("kicker")} title={t("title")} subtitle={t("subtitle")}>
      <AvailabilityWidget courtNames={names} fixedCourt={court} />
    </Section>
  );
}
