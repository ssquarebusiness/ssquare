/**
 * Time helpers. SSquare runs on India Standard Time (UTC+05:30, no daylight saving),
 * so all "day" maths is done in IST regardless of the device's timezone.
 */
import { localeTags, type Locale } from "@/i18n/routing";

export const TZ = "Asia/Kolkata";
const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

/** Calendar date in IST as "YYYY-MM-DD". */
export type DateStr = string;

export function istDateStr(d: Date = new Date()): DateStr {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isDateStr(value: unknown): value is DateStr {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function istStartOfDay(date: DateStr): Date {
  return new Date(`${date}T00:00:00+05:30`);
}

export function istDayRange(date: DateStr) {
  const start = istStartOfDay(date);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** Range covering whole IST days from `from` to `to` (inclusive). */
export function istDateRange(from: DateStr, to: DateStr) {
  return { start: istStartOfDay(from), end: istDayRange(to).end };
}

export function addDays(date: DateStr, n: number): DateStr {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: DateStr, to: DateStr): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS,
  );
}

/** Minutes since IST midnight (0–1439). */
export function istMinutesOfDay(d: Date): number {
  const t = new Date(d.getTime() + IST_OFFSET_MS);
  return t.getUTCHours() * 60 + t.getUTCMinutes();
}

/** Day of week in IST (0 = Sunday). */
export function istWeekday(d: Date): number {
  return new Date(d.getTime() + IST_OFFSET_MS).getUTCDay();
}

/** A Date for `minutes` after IST midnight of `date` (may roll into the next day). */
export function atIST(date: DateStr, minutes: number): Date {
  return new Date(istStartOfDay(date).getTime() + minutes * 60_000);
}

/** "HH:mm" → minutes */
export function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(locale: Locale, opts: Intl.DateTimeFormatOptions) {
  const key = locale + JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(localeTags[locale], { timeZone: TZ, ...opts });
    fmtCache.set(key, f);
  }
  return f;
}

/** "7:30 PM" */
export function formatTime(d: Date | string, locale: Locale = "en"): string {
  return fmt(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(d));
}

/** Minute-of-day → "7:30 PM" (1440 → "12:00 AM"). */
export function formatMinutes(minutes: number, locale: Locale = "en"): string {
  return formatTime(atIST("2000-01-01", minutes), locale);
}

/** Hour label "7 PM" */
export function formatHour(hour: number, locale: Locale = "en"): string {
  return fmt(locale, { hour: "numeric", hour12: true }).format(atIST("2000-01-01", hour * 60));
}

/** "Tue, 14 Oct 2026" */
export function formatDate(
  d: Date | DateStr,
  locale: Locale = "en",
  opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" },
): string {
  const date = typeof d === "string" ? istStartOfDay(d) : d;
  return fmt(locale, opts).format(date);
}

/** "7:00 PM – 8:30 PM" (adds the date of the end time when it rolls past midnight). */
export function formatTimeRange(start: Date | string, end: Date | string, locale: Locale = "en") {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = istDateStr(s) === istDateStr(new Date(e.getTime() - 1));
  const endLabel = sameDay
    ? formatTime(e, locale)
    : `${formatTime(e, locale)} (${formatDate(e, locale, { day: "numeric", month: "short" })})`;
  return `${formatTime(s, locale)} – ${endLabel}`;
}

export function durationMinutes(start: Date | string, end: Date | string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

/** 90 → { hours: 1, minutes: 30 } */
export function splitDuration(minutes: number) {
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}
