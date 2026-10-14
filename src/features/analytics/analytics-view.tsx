"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Locale } from "@/i18n/routing";
import { Card, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { initialRange, RangePicker } from "@/components/staff/range-picker";
import { useRangeBookings, useRangePayments } from "@/features/bookings/queries";
import { useCourtName, useCourts, useNameOf } from "@/features/common/queries";
import { useExpenses } from "@/features/expenses/queries";
import { formatINR } from "@/lib/money";
import { formatDate, formatHour } from "@/lib/time";
import { cn } from "@/lib/utils";
import { computeAnalytics } from "./compute";

/** Validated 2-series palette (dataviz validator: all checks pass on light surface). */
const SERIES = { collected: "#15844f", spent: "#4f6bd8" };

export function AnalyticsView() {
  const t = useTranslations("staff.analytics");
  const [range, setRange] = useState(initialRange("thisMonth"));
  const bookings = useRangeBookings(range.from, range.to);
  const payments = useRangePayments(range.from, range.to);
  const expenses = useExpenses(range.from, range.to);
  const { data: courts } = useCourts();

  const loading = bookings.isLoading || payments.isLoading || expenses.isLoading;
  const a = useMemo(
    () => computeAnalytics(range, bookings.data ?? [], payments.data ?? [], expenses.data ?? [], (courts ?? []).map((c) => c.slug)),
    [range, bookings.data, payments.data, expenses.data, courts],
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
      <RangePicker value={range} onChange={setRange} />
      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t("collected")} value={formatINR(a.collected)} sub={`${t("upi")} ${formatINR(a.upi)} · ${t("cash")} ${formatINR(a.cash)}`} wide />
            <Stat label={t("expenses")} value={formatINR(a.spent)} />
            <Stat label={t("net")} value={formatINR(a.net)} tone={a.net >= 0 ? "good" : "bad"} />
            <Stat label={t("bookings")} value={String(a.bookingCount)} sub={t("avgValue", { amount: formatINR(a.avgValue) })} />
            <Stat label={t("pending")} value={formatINR(a.pending)} />
            <Stat label={t("cancelled")} value={String(a.cancelled)} sub={t("cancelRate", { pct: Math.round(a.cancelRate * 100) })} />
            <Stat label={t("bookingValue")} value={formatINR(a.bookingValue)} />
          </div>

          {a.daily.length > 1 && <DailyChart daily={a.daily} />}
          <Occupancy occupancy={a.occupancy} />
          <Heatmap heat={a.heat} max={a.heatMax} />
          <BarList title={t("cashBy")} rows={a.cashBy} useNames />
          <BarList title={t("expensesByCategory")} rows={a.byCategory} labelNs="expenseCategories" />
          {a.sports.length > 0 && <BarList title={t("sports")} rows={a.sports} labelNs="sports" count />}
          <TopCustomers rows={a.topCustomers} />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone, wide }: { label: string; value: string; sub?: string; tone?: "good" | "bad"; wide?: boolean }) {
  return (
    <Card className={cn(wide && "col-span-2")}>
      <CardTitle>{label}</CardTitle>
      <p className={cn("mt-1 text-2xl font-bold", tone === "good" && "text-brand-700", tone === "bad" && "text-rose-600")}>{value}</p>
      {sub && <p className="mt-0.5 text-sm text-zinc-500">{sub}</p>}
    </Card>
  );
}

function DailyChart({ daily }: { daily: { date: string; collected: number; spent: number }[] }) {
  const t = useTranslations("staff.analytics");
  const locale = useLocale() as Locale;
  const data = daily.map((d) => ({ ...d, label: formatDate(d.date, locale, { day: "numeric", month: "short" }) }));
  return (
    <Card>
      <CardTitle className="mb-3">{t("daily")}</CardTitle>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} margin={{ left: -12, right: 4 }}>
            <CartesianGrid vertical={false} stroke="#ececea" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={{ stroke: "#d4d4d8" }} minTickGap={12} />
            <YAxis tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} formatter={(v) => formatINR(Number(v))}
              contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 13 }} />
            <Legend iconType="square" wrapperStyle={{ fontSize: 13, color: "#3f3f46" }} />
            <Bar dataKey="collected" name={t("collected")} fill={SERIES.collected} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="spent" name={t("expenses")} fill={SERIES.spent} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Occupancy({ occupancy }: { occupancy: { court: string; hours: number; pct: number; bookings: number }[] }) {
  const t = useTranslations("staff.analytics");
  const courtName = useCourtName();
  return (
    <Card className="space-y-3">
      <CardTitle>{t("occupancy")}</CardTitle>
      {occupancy.map((o) => (
        <div key={o.court}>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-zinc-800">{courtName(o.court)}</span>
            <span className="text-zinc-600">{t("occupancyValue", { pct: Math.round(o.pct * 100), hours: Math.round(o.hours * 10) / 10, count: o.bookings })}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(o.pct * 100, 100)}%` }} />
          </div>
        </div>
      ))}
    </Card>
  );
}

/** Weekday × hour grid, single-hue sequential scale (light → dark green). */
function Heatmap({ heat, max }: { heat: number[][]; max: number }) {
  const t = useTranslations("staff.analytics");
  const locale = useLocale() as Locale;
  const days = Array.from({ length: 7 }, (_, i) =>
    formatDate(new Date(Date.UTC(2026, 9, 12 + i, 12)), locale, { weekday: "short" }), // 12 Oct 2026 = Monday
  );
  return (
    <Card>
      <CardTitle>{t("peakHours")}</CardTitle>
      <p className="mb-3 text-xs text-zinc-500">{t("peakHoursHelp")}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-[2px] text-[10px]">
          <thead>
            <tr>
              <th />
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="font-normal text-zinc-500">{h % 6 === 0 ? formatHour(h, locale) : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heat.map((row, d) => (
              <tr key={d}>
                <th className="pr-1 text-left font-medium text-zinc-600">{days[d]}</th>
                {row.map((m, h) => {
                  const v = m / max;
                  return (
                    <td key={h} title={`${days[d]} ${formatHour(h, locale)}: ${Math.round(m / 60 * 10) / 10} h`}
                      className="h-5 min-w-3 rounded-[3px]"
                      style={{ background: m === 0 ? "#f4f4f5" : `color-mix(in oklab, #0b3d2e ${Math.round(15 + v * 85)}%, #eefbf3)` }} />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BarList({ title, rows, useNames, labelNs, count }: {
  title: string; rows: [string, number][]; useNames?: boolean; labelNs?: string; count?: boolean;
}) {
  const tc = useTranslations("common");
  const t = useTranslations("staff.analytics");
  const nameOf = useNameOf();
  const max = Math.max(1, ...rows.map(([, v]) => Math.abs(v)));
  const label = (k: string) => (useNames ? nameOf(k) : labelNs ? tc(`${labelNs}.${k}`) : k);
  return (
    <Card className="space-y-2.5">
      <CardTitle>{title}</CardTitle>
      {rows.length === 0 ? <p className="text-sm text-zinc-500">{t("noData")}</p> : rows.map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-zinc-800">{label(k)}</span>
            <span className="font-semibold text-zinc-900">{count ? v : formatINR(v)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${(Math.abs(v) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </Card>
  );
}

function TopCustomers({ rows }: { rows: { phone: string; name: string; count: number; value: number }[] }) {
  const t = useTranslations("staff.analytics");
  return (
    <Card>
      <CardTitle className="mb-2">{t("repeatCustomers")}</CardTitle>
      {rows.length === 0 ? <p className="text-sm text-zinc-500">{t("noData")}</p> : (
        <table className="w-full text-sm">
          <thead className="text-left text-zinc-500">
            <tr><th className="py-1 font-medium">{t("customer")}</th><th className="font-medium">{t("visits")}</th><th className="text-right font-medium">{t("value")}</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.phone} className="border-t border-zinc-100">
                <td className="py-2"><p className="font-medium">{c.name}</p><p className="text-xs text-zinc-500">{c.phone}</p></td>
                <td>{c.count}</td>
                <td className="text-right font-semibold">{formatINR(c.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
