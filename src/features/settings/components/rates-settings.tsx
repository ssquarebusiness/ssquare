"use client";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { businessConfig } from "@/config/business";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useCourtName, useCourts, useRates } from "@/features/common/queries";
import { parseAmount } from "@/lib/money";
import type { DayType } from "@/lib/pricing";
import { qk } from "@/lib/query-keys";
import { formatMinutes } from "@/lib/time";
import { saveRatesAction } from "../actions";

type Draft = { day_type: DayType; start_minute: number; end_minute: number; price: string };

const STEP = 30;
const TIME_OPTIONS = Array.from({ length: 1440 / STEP + 1 }, (_, i) => i * STEP);

/** Owners edit ₹/hour per court and time window. Changes apply to new bookings and the website. */
export function RatesSettings() {
  const t = useTranslations("staff.settings");
  const { data: courts } = useCourts();
  const { data: rates, isLoading } = useRates();
  if (isLoading || !courts) return <Spinner />;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{t("ratesTitle")}</h2>
      <p className="text-sm text-zinc-500">{t("ratesHelp")}</p>
      {courts.map((c) => (
        <CourtRates key={c.slug} court={c.slug} initial={(rates ?? []).filter((r) => r.court_slug === c.slug)} />
      ))}
    </section>
  );
}

function CourtRates({ court, initial }: { court: string; initial: { day_type: DayType; start_minute: number; end_minute: number; price_per_hour: number }[] }) {
  const t = useTranslations("staff.settings");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const courtName = useCourtName();
  const toast = useToast();
  const qc = useQueryClient();
  const [rows, setRows] = useState<Draft[]>([]);
  const [pending, start] = useTransition();

  useEffect(() => {
    setRows(initial.map((r) => ({ day_type: r.day_type, start_minute: r.start_minute, end_minute: r.end_minute, price: String(r.price_per_hour) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial)]);

  const update = (i: number, patch: Partial<Draft>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const save = () =>
    start(async () => {
      const res = await saveRatesAction(court, rows.map((r) => ({
        day_type: r.day_type, start_minute: r.start_minute, end_minute: r.end_minute, price_per_hour: parseAmount(r.price),
      })));
      if (!res.ok) return toast(te(res.error), "error");
      qc.invalidateQueries({ queryKey: qk.rates });
      toast(t("ratesSaved"));
    });

  const timeLabel = (m: number) => (m === 1440 ? t("midnight") : formatMinutes(m, locale));

  return (
    <Card className="space-y-3">
      <h3 className="font-bold">{courtName(court)}</h3>
      {rows.map((r, i) => (
        <div key={i} className="space-y-2 rounded-xl bg-zinc-50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Select aria-label={t("dayType")} value={r.day_type} onChange={(e) => update(i, { day_type: e.target.value as DayType })}>
              {(["all", "weekday", "weekend"] as const).map((d) => <option key={d} value={d}>{t(`dayTypes.${d}`)}</option>)}
            </Select>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500">₹</span>
              <Input aria-label={t("pricePerHour")} inputMode="numeric" className="pr-12 pl-7" value={r.price}
                onChange={(e) => update(i, { price: e.target.value })} />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-zinc-500">/{t("hr")}</span>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
            <Select aria-label={t("from")} value={r.start_minute} onChange={(e) => update(i, { start_minute: Number(e.target.value) })}>
              {TIME_OPTIONS.slice(0, -1).map((m) => <option key={m} value={m}>{timeLabel(m)}</option>)}
            </Select>
            <span className="text-zinc-500">–</span>
            <Select aria-label={t("to")} value={r.end_minute} onChange={(e) => update(i, { end_minute: Number(e.target.value) })}>
              {TIME_OPTIONS.slice(1).map((m) => <option key={m} value={m}>{timeLabel(m)}</option>)}
            </Select>
            <button onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label={t("removeRate")}
              className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600">
              <Trash2 className="size-5" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm"
          onClick={() => setRows((x) => [...x, { day_type: "all", start_minute: 360, end_minute: 1080, price: "" }])}>
          <Plus className="size-4" /> {t("addRate")}
        </Button>
        <Button size="sm" loading={pending} disabled={rows.length === 0} onClick={save} className="ml-auto">{t("save")}</Button>
      </div>
      <p className="text-xs text-zinc-500">{t("ratesStepNote", { step: businessConfig.slotStepMinutes })}</p>
    </Card>
  );
}
