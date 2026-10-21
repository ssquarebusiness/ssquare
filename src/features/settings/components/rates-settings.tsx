"use client";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { SPORTS, type Sport } from "@/config/business";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useCourtName, useRates } from "@/features/common/queries";
import { parseAmount } from "@/lib/money";
import { qk } from "@/lib/query-keys";
import { saveSportRatesAction } from "../actions";

type Draft = Record<Sport, { weekday: string; weekend: string }>;

/** Owners set ₹/hour per sport for weekdays and weekends. Used for booking totals and shown on the website. */
export function RatesSettings() {
  const t = useTranslations("staff.settings");
  const ts = useTranslations("common.sports");
  const te = useTranslations("errors");
  const courtName = useCourtName();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: rates, isLoading } = useRates();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!rates) return;
    const find = (s: Sport) => rates.find((r) => r.sport === s);
    setDraft(
      Object.fromEntries(
        SPORTS.map((s) => [s, { weekday: String(find(s)?.weekday_price ?? ""), weekend: String(find(s)?.weekend_price ?? "") }]),
      ) as Draft,
    );
  }, [rates]);

  if (isLoading || !draft) return <Spinner />;

  const set = (s: Sport, key: "weekday" | "weekend", value: string) =>
    setDraft((d) => (d ? { ...d, [s]: { ...d[s], [key]: value } } : d));

  const save = () =>
    start(async () => {
      const res = await saveSportRatesAction(
        SPORTS.map((s) => ({ sport: s, weekday_price: parseAmount(draft[s].weekday), weekend_price: parseAmount(draft[s].weekend) })),
      );
      if (!res.ok) return toast(te(res.error), "error");
      qc.invalidateQueries({ queryKey: qk.rates });
      toast(t("ratesSaved"));
    });

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{t("ratesTitle")}</h2>
      <p className="text-sm text-zinc-500">{t("ratesHelp")}</p>
      <Card className="space-y-4">
        <div className="grid grid-cols-[1fr_6.5rem_6.5rem] gap-2 text-xs font-semibold text-zinc-500 uppercase">
          <span>{t("sport")}</span>
          <span>{t("dayTypes.weekday")}</span>
          <span>{t("dayTypes.weekend")}</span>
        </div>
        {SPORTS.map((s) => {
          const court = rates?.find((r) => r.sport === s)?.court_slug;
          return (
            <div key={s} className="grid grid-cols-[1fr_6.5rem_6.5rem] items-center gap-2">
              <div>
                <p className="font-semibold">{ts(s)}</p>
                {court && <p className="text-xs text-zinc-500">{courtName(court)}</p>}
              </div>
              {(["weekday", "weekend"] as const).map((k) => (
                <div key={k} className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500">₹</span>
                  <Input aria-label={`${ts(s)} – ${t(`dayTypes.${k}`)}`} inputMode="numeric" className="pl-7"
                    value={draft[s][k]} onChange={(e) => set(s, k, e.target.value)} onFocus={(e) => e.target.select()} />
                </div>
              ))}
            </div>
          );
        })}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-zinc-500">{t("perHourNote")}</p>
          <Button loading={pending} onClick={save}>{t("save")}</Button>
        </div>
      </Card>
    </section>
  );
}
