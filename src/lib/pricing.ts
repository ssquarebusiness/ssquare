/**
 * Auto-calculates a booking's total from the rate rules owners set in Settings → Rates.
 * A rule covers a time window (can cross midnight, e.g. 6 PM → 6 AM) on weekdays,
 * weekends or all days. Weekday/weekend rules win over "all" rules.
 */
import { businessConfig } from "@/config/business";
import { istMinutesOfDay, istWeekday } from "./time";

export type DayType = "all" | "weekday" | "weekend";

export type RateRule = {
  court_slug: string;
  day_type: DayType;
  start_minute: number; // 0–1439
  end_minute: number; // 1–1440; smaller than start = crosses midnight; equal = all day
  price_per_hour: number;
};

export function isWeekend(weekday: number): boolean {
  return (businessConfig.weekendDays as readonly number[]).includes(weekday);
}

export function ruleCovers(rule: RateRule, minuteOfDay: number, weekday: number): boolean {
  if (rule.day_type === "weekday" && isWeekend(weekday)) return false;
  if (rule.day_type === "weekend" && !isWeekend(weekday)) return false;
  const { start_minute: s, end_minute: e } = rule;
  if (s === e || (s === 0 && e === 1440)) return true;
  return s < e ? minuteOfDay >= s && minuteOfDay < e : minuteOfDay >= s || minuteOfDay < e;
}

/** Hourly rate for a court at a moment, or null if no rule covers it. */
export function rateAt(rules: RateRule[], court: string, at: Date): number | null {
  const minute = istMinutesOfDay(at);
  const weekday = istWeekday(at);
  const courtRules = rules.filter((r) => r.court_slug === court);
  const specific = courtRules.find((r) => r.day_type !== "all" && ruleCovers(r, minute, weekday));
  const general = courtRules.find((r) => r.day_type === "all" && ruleCovers(r, minute, weekday));
  return (specific ?? general)?.price_per_hour ?? null;
}

/**
 * Total price for [start, end). Priced in small steps so a booking that runs from
 * a day rate into a night rate is charged correctly for each part.
 * Returns null when any part of the booking has no rate.
 */
export function computeTotal(
  rules: RateRule[],
  court: string,
  start: Date,
  end: Date,
  stepMinutes = businessConfig.slotStepMinutes,
): number | null {
  let total = 0;
  for (let t = start.getTime(); t < end.getTime(); t += stepMinutes * 60_000) {
    const slice = Math.min(stepMinutes, (end.getTime() - t) / 60_000);
    const rate = rateAt(rules, court, new Date(t));
    if (rate == null) return null;
    total += (rate / 60) * slice;
  }
  return Math.round(total);
}
