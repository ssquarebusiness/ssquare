/**
 * Auto-calculates a booking's total from the per-sport prices owners set in Settings → Rates:
 * one price per hour for weekdays (Mon–Fri) and one for weekends (Sat–Sun).
 * A booking that runs past midnight into a different kind of day is charged by each part.
 */
import { businessConfig } from "@/config/business";
import { istWeekday } from "./time";

export type SportRate = {
  sport: string;
  court_slug: string;
  weekday_price: number;
  weekend_price: number;
  sort?: number;
};

export function isWeekend(weekday: number): boolean {
  return (businessConfig.weekendDays as readonly number[]).includes(weekday);
}

/** Price per hour for a sport at a moment (IST weekday / weekend), or null if not set. */
export function rateAt(rates: SportRate[], sport: string | null | undefined, at: Date): number | null {
  const r = rates.find((x) => x.sport === sport);
  if (!r) return null;
  return isWeekend(istWeekday(at)) ? r.weekend_price : r.weekday_price;
}

/** Total for [start, end), rounded to the rupee. Null when the sport has no price. */
export function computeTotal(
  rates: SportRate[],
  sport: string | null | undefined,
  start: Date,
  end: Date,
  stepMinutes = businessConfig.slotStepMinutes,
): number | null {
  let total = 0;
  for (let t = start.getTime(); t < end.getTime(); t += stepMinutes * 60_000) {
    const slice = Math.min(stepMinutes, (end.getTime() - t) / 60_000);
    const rate = rateAt(rates, sport, new Date(t));
    if (rate == null) return null;
    total += (rate / 60) * slice;
  }
  return Math.round(total);
}
