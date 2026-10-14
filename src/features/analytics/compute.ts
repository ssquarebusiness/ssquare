/**
 * Pure analytics maths over bookings, payments and expenses of a date range.
 * Kept free of React so it is easy to test and reuse in reports.
 */
import { eachDay, type DateRange } from "@/lib/ranges";
import { signed, splitPayments } from "@/lib/payments";
import { bookedMinutesOfDay } from "@/lib/slots";
import { istDateStr, istWeekday, istStartOfDay } from "@/lib/time";
import type { BookingSummary, Expense, Payment } from "@/lib/types";

export type Analytics = ReturnType<typeof computeAnalytics>;

export function computeAnalytics(
  range: DateRange,
  bookings: BookingSummary[],
  payments: Payment[],
  expenses: Expense[],
  courts: string[],
) {
  const days = eachDay(range);
  const live = bookings.filter((b) => b.status !== "cancelled");
  const cancelled = bookings.length - live.length;
  const money = splitPayments(payments);
  const spent = expenses.reduce((a, e) => a + e.amount, 0);

  // Daily collected vs spent (same ₹ axis).
  const daily = days.map((d) => ({
    date: d,
    collected: payments.filter((p) => istDateStr(new Date(p.created_at)) === d).reduce((a, p) => a + signed(p), 0),
    spent: expenses.filter((e) => e.spent_on === d).reduce((a, e) => a + e.amount, 0),
  }));

  // Occupancy per court = booked minutes / available minutes in the range.
  const occupancy = courts.map((court) => {
    const intervals = live.filter((b) => b.court_slug === court).map((b) => ({ start: b.start_at, end: b.end_at }));
    const minutes = days.reduce(
      (acc, d) => acc + bookedMinutesOfDay(d, intervals).reduce((a, r) => a + (r.to - r.from), 0),
      0,
    );
    return { court, hours: minutes / 60, pct: days.length ? minutes / (days.length * 1440) : 0, bookings: intervals.length };
  });

  // Peak hours: booked minutes per weekday × hour (Mon-first rows).
  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const b of live) {
    for (let t = new Date(b.start_at).getTime(); t < new Date(b.end_at).getTime(); t += 15 * 60_000) {
      const at = new Date(t);
      const wd = (istWeekday(at) + 6) % 7;
      const hour = Math.floor(((at.getTime() - istStartOfDay(istDateStr(at)).getTime()) / 60_000) / 60);
      heat[wd][hour] += 15;
    }
  }
  const heatMax = Math.max(1, ...heat.flat());

  const sports = new Map<string, number>();
  for (const b of live) if (b.sport) sports.set(b.sport, (sports.get(b.sport) ?? 0) + 1);

  const byCategory = new Map<string, number>();
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);

  const customers = new Map<string, { phone: string; name: string; count: number; value: number }>();
  for (const b of live) {
    const c = customers.get(b.customer_phone) ?? { phone: b.customer_phone, name: b.customer_name, count: 0, value: 0 };
    c.count += 1;
    c.value += b.total_amount + b.extra_amount;
    customers.set(b.customer_phone, c);
  }

  return {
    collected: money.total,
    upi: money.upi,
    cash: money.cash,
    cashBy: [...money.cashBy.entries()].filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]),
    spent,
    net: money.total - spent,
    bookingCount: live.length,
    cancelled,
    cancelRate: bookings.length ? cancelled / bookings.length : 0,
    bookingValue: live.reduce((a, b) => a + b.total_amount + b.extra_amount, 0),
    pending: live.filter((b) => b.status === "confirmed").reduce((a, b) => a + Math.max(b.remaining_amount, 0), 0),
    avgValue: live.length ? live.reduce((a, b) => a + b.total_amount + b.extra_amount, 0) / live.length : 0,
    daily,
    occupancy,
    heat,
    heatMax,
    sports: [...sports.entries()].sort((a, b) => b[1] - a[1]),
    byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]),
    topCustomers: [...customers.values()].filter((c) => c.count > 1).sort((a, b) => b.count - a.count || b.value - a.value).slice(0, 10),
  };
}
