import { getTranslations } from "next-intl/server";
import { Section } from "@/components/public/section";

export const FAQ_KEYS = ["hours", "book", "duration", "pickleball", "sports", "payment", "cancel"] as const;

export async function Faq({ keys = FAQ_KEYS }: { keys?: readonly (typeof FAQ_KEYS)[number][] }) {
  const t = await getTranslations("public.faq");
  return (
    <Section id="faq" split kicker={t("kicker")} title={t("title")}>
      <div>
        {keys.map((k, i) => (
          <details key={k} open={i === 0} className="group border-b border-line py-4 first:pt-0">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-bold text-ink [&::-webkit-details-marker]:hidden">
              {t(`items.${k}.q`)}
              <span className="text-xl leading-none font-medium text-zinc-400 group-open:hidden">+</span>
              <span className="hidden text-xl leading-none font-medium text-zinc-400 group-open:inline">−</span>
            </summary>
            <p className="mt-2 text-ink-2">{t(`items.${k}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
