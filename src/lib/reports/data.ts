/**
 * Builds the rows shown in Excel / PDF reports (English, business format).
 */
import { formatDate, formatTime, formatTimeRange, type DateStr } from "@/lib/time";
import { signed, splitPayments } from "@/lib/payments";
import type { BookingSummary, Expense, Payment } from "@/lib/types";
import { customerLabel, phoneLabel } from "@/lib/customer";

export type ReportInput = {
  from: DateStr;
  to: DateStr;
  bookings: BookingSummary[];
  /** Payments of the listed bookings (any date). */
  bookingPayments: Payment[];
  /** Payments received inside the date range (any booking). */
  rangePayments: Payment[];
  expenses: Expense[];
  nameOf: (id: string | null | undefined) => string;
  courtName: (slug: string) => string;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildReport(input: ReportInput) {
  const { bookings, bookingPayments, rangePayments, expenses, nameOf, courtName } = input;
  const byBooking = new Map<string, Payment[]>();
  for (const p of bookingPayments) byBooking.set(p.booking_id, [...(byBooking.get(p.booking_id) ?? []), p]);
  const bookingById = new Map(bookings.map((b) => [b.id, b]));

  const bookingRows = bookings.map((b) => {
    const pays = byBooking.get(b.id) ?? [];
    const split = splitPayments(pays);
    const cashBy = [...split.cashBy.entries()].filter(([, v]) => v !== 0).map(([id, v]) => `${nameOf(id)} ${v}`).join(", ");
    const method = split.upi && split.cash ? "UPI + Cash" : split.upi ? "UPI" : split.cash ? "Cash" : "-";
    return {
      code: b.code,
      date: formatDate(new Date(b.start_at), "en", { day: "2-digit", month: "short", year: "numeric" }),
      time: formatTimeRange(b.start_at, b.end_at),
      court: courtName(b.court_slug) + (b.sport ? ` (${cap(b.sport)})` : ""),
      customer: customerLabel(b.customer_name),
      phone: phoneLabel(b.customer_phone),
      status: cap(b.status),
      total: b.total_amount,
      extra: b.extra_amount,
      paid: b.paid_amount,
      upi: split.upi,
      cash: split.cash,
      remaining: b.status === "confirmed" ? Math.max(b.remaining_amount, 0) : 0,
      method,
      cashBy: cashBy || "-",
      bookedBy: nameOf(b.booked_by),
      note: b.status === "cancelled" ? `Cancelled: ${b.cancel_reason ?? ""}${b.advance_action ? ` (advance ${b.advance_action})` : ""}` : b.notes ?? "",
    };
  });

  const paymentRows = rangePayments.map((p) => {
    const b = bookingById.get(p.booking_id);
    return {
      when: `${formatDate(new Date(p.created_at), "en", { day: "2-digit", month: "short" })} ${formatTime(p.created_at)}`,
      code: b?.code ?? "",
      customer: b ? customerLabel(b.customer_name) : "",
      type: cap(p.kind),
      method: p.method.toUpperCase(),
      amount: signed(p),
      receivedBy: nameOf(p.received_by),
      recordedBy: nameOf(p.recorded_by),
      proof: p.screenshot_path ? "Yes" : "",
    };
  });

  const expenseRows = expenses.map((e) => ({
    date: formatDate(e.spent_on, "en", { day: "2-digit", month: "short", year: "numeric" }),
    category: cap(e.category),
    description: e.description,
    by: nameOf(e.expense_by),
    method: e.payment_method.toUpperCase(),
    amount: e.amount,
  }));

  const money = splitPayments(rangePayments);
  const live = bookings.filter((b) => b.status !== "cancelled");
  const spent = expenses.reduce((a, e) => a + e.amount, 0);
  const summary: [string, string | number][] = [
    ["Period", input.from === input.to ? formatDate(input.from) : `${formatDate(input.from)} to ${formatDate(input.to)}`],
    ["Bookings (not cancelled)", live.length],
    ["Cancelled bookings", bookings.length - live.length],
    ["Booking value (total + extras)", live.reduce((a, b) => a + b.total_amount + b.extra_amount, 0)],
    ["Pending to collect", bookingRows.reduce((a, r) => a + r.remaining, 0)],
    ["Money received in period", money.total],
    ["   via UPI", money.upi],
    ["   via Cash", money.cash],
    ...[...money.cashBy.entries()].filter(([, v]) => v !== 0).map(([id, v]) => [`   Cash with ${nameOf(id)}`, v] as [string, number]),
    ["Expenses", spent],
    ["Net (received - expenses)", money.total - spent],
  ];

  return { bookingRows, paymentRows, expenseRows, summary };
}

export type Report = ReturnType<typeof buildReport>;
