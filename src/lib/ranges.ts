import { addDays, istDateStr, istWeekday, istStartOfDay, type DateStr } from "./time";

export const RANGE_PRESETS = ["today", "yesterday", "thisWeek", "thisMonth", "lastMonth", "custom"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];
export type DateRange = { from: DateStr; to: DateStr };

/** Date range for a preset, in IST. Weeks start on Monday. */
export function presetRange(preset: Exclude<RangePreset, "custom">, now: Date = new Date()): DateRange {
  const today = istDateStr(now);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: y };
    }
    case "thisWeek": {
      const wd = istWeekday(istStartOfDay(today));
      return { from: addDays(today, -((wd + 6) % 7)), to: today };
    }
    case "thisMonth":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "lastMonth": {
      const firstThis = `${today.slice(0, 7)}-01`;
      const lastPrev = addDays(firstThis, -1);
      return { from: `${lastPrev.slice(0, 7)}-01`, to: lastPrev };
    }
  }
}

/** Every date in the range (inclusive). */
export function eachDay({ from, to }: DateRange): DateStr[] {
  const out: DateStr[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}
