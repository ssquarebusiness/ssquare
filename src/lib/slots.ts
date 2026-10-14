/**
 * Turns bookings (exact start/end times) into the hourly rows shown on the
 * public availability view. Each hour knows which minutes are booked, so rows can
 * be drawn with a partial fill ("Free from 7:30").
 */
import { businessConfig } from "@/config/business";
import { istDateStr, istDayRange, istMinutesOfDay, type DateStr } from "./time";

export type Interval = { start: Date | string; end: Date | string };
/** Minute range within a day, `to` exclusive. */
export type MinuteRange = { from: number; to: number };

export type HourStatus = "free" | "partial" | "booked" | "past";

export type HourRow = {
  hour: number;
  /** Booked ranges relative to the hour (0–60). */
  booked: MinuteRange[];
  /** Minutes of this hour already gone (only for today / past dates). */
  pastMinutes: number;
  /** Free ranges (not booked, not past), relative to the hour. */
  free: MinuteRange[];
  status: HourStatus;
  /** Minute-of-day when this row first becomes bookable, if any. */
  firstFreeMinute: number | null;
  /** Hint for partial rows. */
  hint: { kind: "freeFrom" | "freeUntil" | "partly"; minute: number } | null;
};

/** Clips intervals to the IST day and merges overlaps → sorted minute ranges (0–1440). */
export function bookedMinutesOfDay(date: DateStr, intervals: Interval[]): MinuteRange[] {
  const { start: dayStart, end: dayEnd } = istDayRange(date);
  const ranges = intervals
    .map(({ start, end }) => {
      const s = Math.max(new Date(start).getTime(), dayStart.getTime());
      const e = Math.min(new Date(end).getTime(), dayEnd.getTime());
      return {
        from: Math.floor((s - dayStart.getTime()) / 60_000),
        to: Math.ceil((e - dayStart.getTime()) / 60_000),
      };
    })
    .filter((r) => r.to > r.from)
    .sort((a, b) => a.from - b.from);

  const merged: MinuteRange[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.from <= last.to) last.to = Math.max(last.to, r.to);
    else merged.push({ ...r });
  }
  return merged;
}

/** Minutes of `date` already passed at `now` (0, partial, or 1440). */
export function pastMinutesOfDay(date: DateStr, now: Date = new Date()): number {
  const today = istDateStr(now);
  if (date < today) return 1440;
  if (date > today) return 0;
  return istMinutesOfDay(now);
}

function subtract(base: MinuteRange, cuts: MinuteRange[]): MinuteRange[] {
  let pieces: MinuteRange[] = [base];
  for (const c of cuts) {
    pieces = pieces.flatMap((p) => {
      if (c.to <= p.from || c.from >= p.to) return [p];
      const out: MinuteRange[] = [];
      if (c.from > p.from) out.push({ from: p.from, to: c.from });
      if (c.to < p.to) out.push({ from: c.to, to: p.to });
      return out;
    });
  }
  return pieces;
}

export function buildHourRows(
  date: DateStr,
  intervals: Interval[],
  now: Date = new Date(),
): HourRow[] {
  const booked = bookedMinutesOfDay(date, intervals);
  const past = pastMinutesOfDay(date, now);

  return Array.from({ length: 24 }, (_, hour) => {
    const hStart = hour * 60;
    const hEnd = hStart + 60;
    const bookedRel = booked
      .filter((r) => r.to > hStart && r.from < hEnd)
      .map((r) => ({ from: Math.max(r.from, hStart) - hStart, to: Math.min(r.to, hEnd) - hStart }));
    const pastMinutes = Math.min(Math.max(past - hStart, 0), 60);

    const free = subtract({ from: pastMinutes, to: 60 }, bookedRel).filter((r) => r.to > r.from);
    const bookedTotal = bookedRel.reduce((a, r) => a + (r.to - r.from), 0);
    const freeTotal = free.reduce((a, r) => a + (r.to - r.from), 0);

    let status: HourStatus;
    if (freeTotal === 0) status = pastMinutes === 60 ? "past" : bookedTotal > 0 ? "booked" : "past";
    else if (bookedTotal === 0) status = "free";
    else status = "partial";

    let hint: HourRow["hint"] = null;
    if (status === "partial") {
      if (free.length === 1 && free[0].to === 60) hint = { kind: "freeFrom", minute: hStart + free[0].from };
      else if (free.length === 1) hint = { kind: "freeUntil", minute: hStart + free[0].to };
      else hint = { kind: "partly", minute: hStart + free[0].from };
    }

    return {
      hour,
      booked: bookedRel,
      pastMinutes,
      free,
      status,
      firstFreeMinute: free.length ? roundUp(hStart + free[0].from) : null,
      hint,
    };
  });
}

/** Rounds up to the booking step so suggested start times look natural (7:30, not 7:23). */
function roundUp(minute: number, step = businessConfig.slotStepMinutes): number {
  return Math.ceil(minute / step) * step;
}

/** How long a court stays free starting at `minute` (end of free window as minute-of-day). */
export function freeUntil(minute: number, booked: MinuteRange[]): number {
  const next = booked.find((r) => r.to > minute);
  if (!next) return 1440;
  return next.from > minute ? next.from : minute;
}

/** True when [start, end) overlaps any interval. */
export function overlaps(
  start: Date,
  end: Date,
  intervals: (Interval & { id?: string })[],
  ignoreId?: string,
): boolean {
  return intervals.some(
    (i) =>
      i.id !== ignoreId &&
      new Date(i.start).getTime() < end.getTime() &&
      new Date(i.end).getTime() > start.getTime(),
  );
}

export function groupByDayPart(rows: HourRow[]) {
  return businessConfig.dayParts.map((part) => ({
    ...part,
    rows: rows.filter((r) => r.hour >= part.from && r.hour < part.to),
  }));
}

/** Day part that contains the given minute-of-day. */
export function dayPartOf(minute: number) {
  const hour = Math.floor(minute / 60);
  return businessConfig.dayParts.find((p) => hour >= p.from && hour < p.to)?.key ?? "evening";
}
