import { describe, expect, it } from "vitest";
import { computeTotal, rateAt, type RateRule } from "./pricing";

const ist = (s: string) => new Date(`${s}+05:30`);
const rules: RateRule[] = [
  { court_slug: "turf", day_type: "all", start_minute: 360, end_minute: 1080, price_per_hour: 800 }, // 6 AM–6 PM
  { court_slug: "turf", day_type: "all", start_minute: 1080, end_minute: 360, price_per_hour: 1000 }, // 6 PM–6 AM
  { court_slug: "turf", day_type: "weekend", start_minute: 1080, end_minute: 360, price_per_hour: 1200 },
  { court_slug: "pickleball", day_type: "all", start_minute: 0, end_minute: 1440, price_per_hour: 400 },
];

describe("pricing", () => {
  it("uses day and night rates (2026-10-14 is a Wednesday)", () => {
    expect(rateAt(rules, "turf", ist("2026-10-14T10:00:00"))).toBe(800);
    expect(rateAt(rules, "turf", ist("2026-10-14T23:00:00"))).toBe(1000);
    expect(rateAt(rules, "turf", ist("2026-10-15T02:00:00"))).toBe(1000);
  });

  it("prefers weekend rules over 'all' rules", () => {
    expect(rateAt(rules, "turf", ist("2026-10-17T20:00:00"))).toBe(1200); // Saturday
  });

  it("splits a booking across rate boundaries", () => {
    // 5:00–6:30 PM → 1h @800 + 30m @1000
    expect(computeTotal(rules, "turf", ist("2026-10-14T17:00:00"), ist("2026-10-14T18:30:00"))).toBe(1300);
  });

  it("handles 90-minute pickleball booking", () => {
    expect(computeTotal(rules, "pickleball", ist("2026-10-14T07:00:00"), ist("2026-10-14T08:30:00"))).toBe(600);
  });

  it("returns null when no rule covers the time", () => {
    expect(computeTotal(rules, "unknown", ist("2026-10-14T07:00:00"), ist("2026-10-14T08:00:00"))).toBeNull();
  });
});
