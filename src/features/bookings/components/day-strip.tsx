"use client";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { bookedMinutesOfDay } from "@/lib/slots";
import { formatHour, istDayRange, type DateStr } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * Compact 24-hour bar for one court: red = already booked, green/red outline = the time being chosen.
 * Helps staff see gaps at a glance while creating a booking.
 */
export function DayStrip({
  date,
  busy,
  selection,
  clash,
}: {
  date: DateStr;
  court: string;
  busy: { start_at: string; end_at: string }[];
  selection?: { start: Date; end: Date };
  clash?: boolean;
}) {
  const locale = useLocale() as Locale;
  const booked = bookedMinutesOfDay(date, busy.map((b) => ({ start: b.start_at, end: b.end_at })));
  const { start: dayStart } = istDayRange(date);

  let sel: { from: number; to: number } | null = null;
  if (selection) {
    const from = (selection.start.getTime() - dayStart.getTime()) / 60_000;
    const to = Math.min((selection.end.getTime() - dayStart.getTime()) / 60_000, 1440);
    sel = { from, to };
  }

  const pct = (m: number) => `${(m / 1440) * 100}%`;

  return (
    <div aria-hidden className="pt-1">
      <div className="relative h-7 overflow-hidden rounded-lg bg-free-soft ring-1 ring-line">
        {booked.map((r) => (
          <div key={r.from} className="absolute inset-y-0 bg-booked/80" style={{ left: pct(r.from), width: pct(r.to - r.from) }} />
        ))}
        {sel && (
          <div
            className={cn("absolute inset-y-0 rounded-md border-2", clash ? "border-booked-ink bg-booked-ink/25" : "border-ink bg-ink/15")}
            style={{ left: pct(sel.from), width: pct(sel.to - sel.from) }}
          />
        )}
        {[6, 12, 18].map((h) => (
          <div key={h} className="absolute inset-y-0 w-px bg-zinc-400/40" style={{ left: pct(h * 60) }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
        {[0, 6, 12, 18, 24].map((h) => <span key={h}>{formatHour(h % 24, locale)}</span>)}
      </div>
    </div>
  );
}
