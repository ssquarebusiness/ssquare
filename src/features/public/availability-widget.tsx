"use client";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, ChevronDown, Phone } from "lucide-react";
import { businessConfig, COURTS, type CourtSlug } from "@/config/business";
import { enquiryMessage } from "@/config/messages";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { DatePickerButton } from "@/components/ui/date-picker-button";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { WhatsAppIcon } from "@/features/bookings/components/booking-confirmation";
import { bookedMinutesOfDay, buildHourRows, dayPartOf, freeUntil, groupByDayPart, type HourRow } from "@/lib/slots";
import { addDays, formatDate, formatHour, formatMinutes, istDateStr, istMinutesOfDay, type DateStr } from "@/lib/time";
import { cn, telHref, whatsappHref } from "@/lib/utils";
import { useAvailability } from "./use-availability";

/**
 * Public availability: court tabs → date strip → 24 hourly rows in 4 day-parts.
 * Each row shows booked minutes to scale, so 1½-hour bookings read naturally ("Free from 7:30").
 */
export function AvailabilityWidget({ courtNames, fixedCourt }: { courtNames: Record<CourtSlug, string>; fixedCourt?: CourtSlug }) {
  const t = useTranslations("public.availability");
  const locale = useLocale() as Locale;
  const [today, setToday] = useState(() => istDateStr());
  const [date, setDate] = useState<DateStr>(today);
  const [court, setCourt] = useState<CourtSlug>(fixedCourt ?? "turf");

  // Open on the court named in the link (?court=pickleball), and keep the URL in sync so it can be shared.
  useEffect(() => {
    if (fixedCourt) return;
    const fromUrl = new URLSearchParams(window.location.search).get("court");
    if (fromUrl && (COURTS as readonly string[]).includes(fromUrl)) setCourt(fromUrl as CourtSlug);
  }, [fixedCourt]);
  const selectCourt = (c: CourtSlug) => {
    setCourt(c);
    const url = new URL(window.location.href);
    url.searchParams.set("court", c);
    window.history.replaceState(window.history.state, "", url);
  };
  const [now, setNow] = useState(() => new Date());
  const [pick, setPick] = useState<{ minute: number; until: number } | null>(null);
  const { data, error, loading, retry } = useAvailability(date);

  // Keep "now" fresh so past hours grey out and the date rolls over at midnight.
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNow(n);
      setToday(istDateStr(n));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const intervals = useMemo(
    () => (data ?? []).filter((b) => b.court_slug === court).map((b) => ({ start: b.start_at, end: b.end_at })),
    [data, court],
  );
  const rows = useMemo(() => buildHourRows(date, intervals, now), [date, intervals, now]);
  const parts = groupByDayPart(rows);
  const booked = useMemo(() => bookedMinutesOfDay(date, intervals), [date, intervals]);
  const defaultPart = date === today ? dayPartOf(istMinutesOfDay(now)) : "evening";
  const [open, setOpen] = useState<Set<string>>(new Set([defaultPart]));
  useEffect(() => setOpen(new Set([defaultPart])), [date, defaultPart]);

  const days = Array.from({ length: businessConfig.dateStripDays }, (_, i) => addDays(today, i));
  const maxDate = addDays(today, businessConfig.publicAvailabilityDaysAhead);
  const dayLabel = (d: DateStr) =>
    d === today ? t("today") : d === addDays(today, 1) ? t("tomorrow") : formatDate(d, locale, { weekday: "short" });

  const choose = (row: HourRow) => {
    if (row.firstFreeMinute == null) return;
    setPick({ minute: row.firstFreeMinute, until: freeUntil(row.firstFreeMinute, booked) });
  };

  const message = pick
    ? enquiryMessage(locale, courtNames[court], formatDate(date, locale, { weekday: "long", day: "numeric", month: "long" }), formatMinutes(pick.minute, locale))
    : "";

  return (
    <div className="rounded-[22px] border border-line bg-white p-4 shadow-card sm:p-5">
      {!fixedCourt && (
        <div role="tablist" aria-label={t("title")} className="grid grid-cols-2 gap-1 rounded-xl bg-soft p-1">
          {COURTS.map((c) => (
            <button key={c} role="tab" aria-selected={court === c} onClick={() => selectCourt(c)}
              className={cn("rounded-[9px] px-2 py-2.5 text-[14.5px] font-bold transition",
                court === c ? "bg-white text-ink shadow-sm" : "text-zinc-500")}>
              {courtNames[c]}
            </button>
          ))}
        </div>
      )}

      <div className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4 pt-4 pb-2.5 sm:-mx-5 sm:px-5">
        {days.map((d) => (
          <button key={d} onClick={() => setDate(d)} aria-pressed={date === d}
            className={cn("flex min-w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2 transition",
              date === d ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-line bg-white")}>
            <span className="text-[11px] font-semibold text-zinc-500">{dayLabel(d)}</span>
            <span className="text-lg leading-tight font-bold text-ink">{formatDate(d, locale, { day: "numeric" })}</span>
            <span className="text-[11px] font-semibold text-zinc-500">{formatDate(d, locale, { month: "short" })}</span>
          </button>
        ))}
        <DatePickerButton
          value={date}
          min={today}
          max={maxDate}
          onChange={setDate}
          label={t("pickDate")}
          className={cn(
            "flex h-full min-w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-2.5 py-2",
            days.includes(date) ? "border-line bg-white text-zinc-500" : "border-brand-500 bg-brand-50 text-ink ring-1 ring-brand-500",
          )}
        >
          <CalendarDays className="size-[18px]" />
          {days.includes(date) ? (
            <span className="text-[11px] font-semibold">{t("pickDate")}</span>
          ) : (
            <span className="text-xs font-bold">{formatDate(date, locale, { day: "numeric", month: "short" })}</span>
          )}
        </DatePickerButton>
      </div>

      {!days.includes(date) && (
        <p className="pb-1 font-bold text-ink">{formatDate(date, locale, { weekday: "long", day: "numeric", month: "long" })}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 pt-1 pb-3 text-[13px] text-zinc-500">
        <Legend className="bg-free" label={t("legendFree")} />
        <Legend className="bg-booked" label={t("legendBooked")} />
        <Legend className="bg-past" label={t("legendPast")} />
        {loading && data && <Spinner className="size-4 text-zinc-400" />}
      </div>

      {error && !data ? (
        <div className="rounded-xl bg-booked-soft p-4 text-center text-booked-ink">
          <p>{t("error")}</p>
          <button onClick={retry} className="mt-2 font-semibold underline">{t("retry")}</button>
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-500"><Spinner /> {t("loading")}</div>
      ) : (
        <div>
          {parts.map((part) => {
            const isOpen = open.has(part.key);
            const freeHours = part.rows.reduce((a, r) => a + r.free.reduce((x, f) => x + f.to - f.from, 0), 0) / 60;
            return (
              <section key={part.key} className="border-t border-line">
                <button
                  onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(part.key)) n.delete(part.key); else n.add(part.key); return n; })}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                >
                  <span className="font-bold text-ink">{t(`parts.${part.key}`)}</span>
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-zinc-500">
                    {formatHour(part.from, locale)} – {formatHour(part.to % 24, locale)} ·{" "}
                    {part.rows.every((r) => r.status === "past") ? t("status.past") : t("freeHours", { count: Math.floor(freeHours) })}
                    <ChevronDown className={cn("size-4 transition", isOpen && "rotate-180")} />
                  </span>
                </button>
                {isOpen && (
                  <ul className="pb-2">
                    {part.rows.map((row) => <HourRowView key={row.hour} row={row} onChoose={() => choose(row)} />)}
                  </ul>
                )}
              </section>
            );
          })}
          <p className="mt-2 flex items-center gap-2.5 rounded-xl bg-brand-50 px-3.5 py-3 text-sm font-semibold text-brand-700">
            <WhatsAppIcon className="size-4 shrink-0" /> {t("hint")}
          </p>
        </div>
      )}

      <Sheet open={!!pick} onClose={() => setPick(null)} title={t("sheetTitle")}>
        {pick && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-50 p-4">
              <p className="font-bold text-ink">{courtNames[court]}</p>
              <p className="text-ink-2">{formatDate(date, locale, { weekday: "long", day: "numeric", month: "long" })}</p>
              <p className="mt-1 font-semibold text-free-ink">
                {t("freeWindow", { from: formatMinutes(pick.minute, locale), to: formatMinutes(pick.until, locale) })}
              </p>
            </div>
            <a href={whatsappHref(message, siteConfig.contact.whatsapp)} target="_blank" rel="noopener noreferrer"
              className={buttonClass("primary", "xl", "w-full")}>
              <WhatsAppIcon className="size-5" /> {t("bookWhatsapp")}
            </a>
            <div className="grid gap-2">
              {siteConfig.contact.phones.map((p) => (
                <a key={p.number} href={telHref(p.number)} className={buttonClass("outline", "lg", "w-full")}>
                  <Phone className="size-5" /> {t("callName", { name: p.name })}
                </a>
              ))}
            </div>
            <p className="text-sm text-zinc-500">{t("sheetNote")}</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-[3px]", className)} aria-hidden /> {label}
    </span>
  );
}

function HourRowView({ row, onChoose }: { row: HourRow; onChoose: () => void }) {
  const t = useTranslations("public.availability");
  const locale = useLocale() as Locale;
  const clickable = row.firstFreeMinute != null;

  const label =
    row.status === "partial" && row.hint
      ? row.hint.kind === "partly" ? t("status.partly") : t(`status.${row.hint.kind}`, { time: formatMinutes(row.hint.minute, locale) })
      : t(`status.${row.status}`);

  const pct = (m: number) => `${(m / 60) * 100}%`;

  return (
    <li>
      <button onClick={onChoose} disabled={!clickable}
        className={cn("grid min-h-11 w-full grid-cols-[2.75rem_1fr_5.75rem] items-center gap-2.5 rounded-lg px-1 py-1.5 text-left sm:grid-cols-[3.25rem_1fr_7.5rem] sm:gap-3",
          clickable ? "hover:bg-soft active:bg-brand-50" : "cursor-default")}>
        <span className="text-[13px] font-bold text-ink-2 sm:text-[13.5px]">{formatHour(row.hour, locale)}</span>
        <span className="relative h-2.5 min-w-0 overflow-hidden rounded-full bg-free" aria-hidden>
          {row.pastMinutes > 0 && <span className="absolute inset-y-0 left-0 bg-past" style={{ width: pct(row.pastMinutes) }} />}
          {row.booked.map((b) => (
            <span key={b.from} className="absolute inset-y-0 bg-booked" style={{ left: pct(b.from), width: pct(b.to - b.from) }} />
          ))}
        </span>
        <span className={cn("text-right text-xs leading-tight font-semibold sm:text-[13px]",
          row.status === "free" ? "text-free-ink" : row.status === "booked" ? "text-booked-ink" : row.status === "past" ? "text-zinc-400" : "text-partial-ink")}>
          {label}
        </span>
      </button>
    </li>
  );
}
