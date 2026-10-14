/** All amounts are whole rupees (integers). */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 1200 → "₹1,200" */
export function formatINR(amount: number | null | undefined): string {
  return inr.format(Math.round(amount ?? 0));
}

/** Parses user input like "1,200" → 1200. Empty / invalid → 0. */
export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  const n = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((acc, item) => acc + (pick(item) || 0), 0);
}
