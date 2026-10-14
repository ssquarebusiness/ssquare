import { describe, expect, it } from "vitest";
import type { BookingSummary, Expense, Payment } from "@/lib/types";
import { computeAnalytics } from "./compute";

const b = (o: Partial<BookingSummary>): BookingSummary => ({
  id: Math.random().toString(), code: "SSQ-1", court_slug: "turf", sport: "cricket", customer_name: "A",
  customer_phone: "9999999999", customer_email: null, start_at: "2026-10-14T18:00:00+05:30", end_at: "2026-10-14T19:00:00+05:30",
  total_amount: 1000, extra_amount: 0, status: "completed", booked_by: null, created_by: null, completed_by: null,
  completed_at: null, cancelled_by: null, cancelled_at: null, cancel_reason: null, advance_action: null, notes: null,
  created_at: "", paid_amount: 1000, remaining_amount: 0, ...o,
});
const pay = (o: Partial<Payment>): Payment => ({
  id: "p", booking_id: "b", kind: "settlement", method: "upi", amount: 0, received_by: "ravi", recorded_by: "ravi",
  screenshot_path: null, note: null, created_at: "2026-10-14T19:05:00+05:30", ...o,
});

describe("computeAnalytics", () => {
  it("computes money, occupancy, cancellations and repeat customers", () => {
    const a = computeAnalytics(
      { from: "2026-10-14", to: "2026-10-14" },
      [b({}), b({ start_at: "2026-10-14T20:00:00+05:30", end_at: "2026-10-14T23:00:00+05:30" }), b({ status: "cancelled", customer_phone: "8888888888" })],
      [pay({ amount: 700 }), pay({ method: "cash", amount: 300 })],
      [{ id: "e", spent_on: "2026-10-14", amount: 200, category: "water", description: "x", expense_by: "s", payment_method: "cash", created_by: "s", created_at: "" } as Expense],
      ["turf", "pickleball"],
    );
    expect(a.collected).toBe(1000);
    expect(a.net).toBe(800);
    expect(a.bookingCount).toBe(2);
    expect(a.cancelRate).toBeCloseTo(1 / 3);
    expect(a.occupancy[0].hours).toBe(4);
    expect(a.occupancy[0].pct).toBeCloseTo(4 / 24);
    expect(a.topCustomers[0].count).toBe(2);
    expect(a.heat[2][18]).toBe(60); // Wednesday 6 PM
    expect(a.daily[0]).toEqual({ date: "2026-10-14", collected: 1000, spent: 200 });
  });
});
