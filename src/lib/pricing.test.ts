import { describe, expect, it } from "vitest";
import { computeTotal, rateAt, type SportRate } from "./pricing";

const ist = (s: string) => new Date(`${s}+05:30`);
const rates: SportRate[] = [
  { sport: "cricket", court_slug: "turf", weekday_price: 800, weekend_price: 1000 },
  { sport: "pickleball", court_slug: "pickleball", weekday_price: 400, weekend_price: 500 },
];

describe("pricing", () => {
  it("uses weekday and weekend prices (2026-10-14 is a Wednesday)", () => {
    expect(rateAt(rates, "cricket", ist("2026-10-14T20:00:00"))).toBe(800);
    expect(rateAt(rates, "cricket", ist("2026-10-17T20:00:00"))).toBe(1000); // Saturday
    expect(rateAt(rates, "cricket", ist("2026-10-18T07:00:00"))).toBe(1000); // Sunday
  });

  it("charges 90 minutes correctly", () => {
    expect(computeTotal(rates, "pickleball", ist("2026-10-14T07:00:00"), ist("2026-10-14T08:30:00"))).toBe(600);
  });

  it("splits a Friday-night booking that runs into Saturday", () => {
    // Fri 11 PM – Sat 1 AM → 1h weekday + 1h weekend
    expect(computeTotal(rates, "cricket", ist("2026-10-16T23:00:00"), ist("2026-10-17T01:00:00"))).toBe(1800);
  });

  it("returns null when the sport has no price", () => {
    expect(computeTotal(rates, "football", ist("2026-10-14T07:00:00"), ist("2026-10-14T08:00:00"))).toBeNull();
    expect(computeTotal(rates, null, ist("2026-10-14T07:00:00"), ist("2026-10-14T08:00:00"))).toBeNull();
  });
});
