import type { Payment } from "./types";

export const signed = (p: Pick<Payment, "kind" | "amount">) => (p.kind === "refund" ? -p.amount : p.amount);

/** Totals of a list of payments: UPI, cash, and cash per receiver. */
export function splitPayments(payments: Payment[]) {
  let upi = 0;
  let cash = 0;
  const cashBy = new Map<string, number>();
  const upiBy = new Map<string, number>();
  for (const p of payments) {
    const v = signed(p);
    if (p.method === "upi") {
      upi += v;
      upiBy.set(p.received_by, (upiBy.get(p.received_by) ?? 0) + v);
    } else {
      cash += v;
      cashBy.set(p.received_by, (cashBy.get(p.received_by) ?? 0) + v);
    }
  }
  return { upi, cash, total: upi + cash, cashBy, upiBy };
}
