import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { Section } from "@/components/public/section";

export const FAQ_KEYS = ["hours", "book", "duration", "pickleball", "sports", "payment", "cancel"] as const;

export async function Faq({ keys = FAQ_KEYS }: { keys?: readonly (typeof FAQ_KEYS)[number][] }) {
  const t = await getTranslations("public.faq");
  return (
    <Section id="faq" title={t("title")} tone="soft">
      <div className="mx-auto max-w-3xl space-y-3">
        {keys.map((k) => (
          <details key={k} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-semibold text-brand-950 [&::-webkit-details-marker]:hidden">
              {t(`items.${k}.q`)}
              <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-zinc-700">{t(`items.${k}.a`)}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
