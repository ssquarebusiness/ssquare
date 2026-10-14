import { describe, expect, it } from "vitest";
import { splitPayments } from "./payments";
import type { Payment } from "./types";

const p = (o: Partial<Payment>): Payment => ({
  id: "x", booking_id: "b", kind: "settlement", method: "cash", amount: 0, received_by: "ravi",
  recorded_by: "ravi", screenshot_path: null, note: null, created_at: "", ...o,
});

describe("splitPayments", () => {
  it("splits UPI/cash, cash per person, and subtracts refunds", () => {
    const r = splitPayments([
      p({ kind: "advance", method: "cash", amount: 500, received_by: "shail" }),
      p({ method: "cash", amount: 400 }),
      p({ method: "upi", amount: 700 }),
      p({ kind: "refund", method: "cash", amount: 500, received_by: "shail" }),
    ]);
    expect(r).toMatchObject({ upi: 700, cash: 400, total: 1100 });
    expect(r.cashBy.get("ravi")).toBe(400);
    expect(r.cashBy.get("shail")).toBe(0);
  });
});
