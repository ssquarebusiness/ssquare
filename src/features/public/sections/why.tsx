import { getTranslations } from "next-intl/server";
import { Award, CalendarCheck, Clock, Leaf, ShieldCheck, Sun } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Section } from "@/components/public/section";

const ICONS = { onlyPickleball: Award, open24: Clock, quality: Leaf, lights: Sun, family: ShieldCheck, booking: CalendarCheck } as const;

export async function Why() {
  const t = await getTranslations("public.why");
  return (
    <Section id="why" tone="soft" kicker={t("kicker")} title={t("title")} subtitle={t("subtitle")}>
      <ul className="grid gap-6 md:grid-cols-3 md:gap-8">
        {siteConfig.whyPoints.map((key) => {
          const Icon = ICONS[key];
          return (
            <li key={key} className="flex gap-3.5">
              <span className="grid size-[42px] shrink-0 place-items-center rounded-xl border border-line bg-white text-brand-700"><Icon className="size-5" /></span>
              <div>
                <h3 className="font-bold text-ink">{t(`items.${key}.title`)}</h3>
                <p className="text-[14.5px] text-zinc-500">{t(`items.${key}.text`)}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
