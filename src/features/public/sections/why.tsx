import { getTranslations } from "next-intl/server";
import { CalendarCheck, Clock, Heart, Lightbulb, Medal, Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Section } from "@/components/public/section";

const ICONS = { onlyPickleball: Medal, open24: Clock, quality: Star, lights: Lightbulb, family: Heart, booking: CalendarCheck } as const;

export async function Why() {
  const t = await getTranslations("public.why");
  return (
    <Section id="why" title={t("title")} subtitle={t("subtitle")}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {siteConfig.whyPoints.map((key) => {
          const Icon = ICONS[key];
          return (
            <li key={key} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-800"><Icon className="size-6" /></span>
              <h3 className="mt-4 text-lg font-bold text-brand-950">{t(`items.${key}.title`)}</h3>
              <p className="mt-1 text-zinc-600">{t(`items.${key}.text`)}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
