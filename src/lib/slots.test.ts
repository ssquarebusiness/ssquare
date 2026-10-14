import { describe, expect, it } from "vitest";
import { bookedMinutesOfDay, buildHourRows, freeUntil, overlaps } from "./slots";

const ist = (s: string) => new Date(`${s}+05:30`);
const FUTURE_NOW = ist("2026-10-01T10:00:00"); // before the test date → nothing is "past"

describe("bookedMinutesOfDay", () => {
  it("merges overlapping and touching bookings", () => {
    const r = bookedMinutesOfDay("2026-10-14", [
      { start: ist("2026-10-14T18:00:00"), end: ist("2026-10-14T19:30:00") },
      { start: ist("2026-10-14T19:30:00"), end: ist("2026-10-14T21:00:00") },
    ]);
    expect(r).toEqual([{ from: 1080, to: 1260 }]);
  });

  it("clips a booking that crosses midnight onto both days", () => {
    const b = [{ start: ist("2026-10-14T23:00:00"), end: ist("2026-10-15T01:30:00") }];
    expect(bookedMinutesOfDay("2026-10-14", b)).toEqual([{ from: 1380, to: 1440 }]);
    expect(bookedMinutesOfDay("2026-10-15", b)).toEqual([{ from: 0, to: 90 }]);
  });
});

describe("buildHourRows", () => {
  it("marks partial hours with a 'free from' hint", () => {
    const rows = buildHourRows(
      "2026-10-14",
      [{ start: ist("2026-10-14T18:00:00"), end: ist("2026-10-14T19:30:00") }],
      FUTURE_NOW,
    );
    expect(rows[17].status).toBe("free");
    expect(rows[18].status).toBe("booked");
    expect(rows[19].status).toBe("partial");
    expect(rows[19].hint).toEqual({ kind: "freeFrom", minute: 19 * 60 + 30 });
    expect(rows[19].firstFreeMinute).toBe(19 * 60 + 30);
  });

  it("marks 'free until' when the hour ends booked", () => {
    const rows = buildHourRows(
      "2026-10-14",
      [{ start: ist("2026-10-14T07:15:00"), end: ist("2026-10-14T09:00:00") }],
      FUTURE_NOW,
    );
    expect(rows[7].hint).toEqual({ kind: "freeUntil", minute: 7 * 60 + 15 });
  });

  it("greys out the past part of today", () => {
    const rows = buildHourRows("2026-10-14", [], ist("2026-10-14T10:20:00"));
    expect(rows[9].status).toBe("past");
    expect(rows[10].status).toBe("free");
    expect(rows[10].pastMinutes).toBe(20);
    expect(rows[10].firstFreeMinute).toBe(10 * 60 + 30);
    expect(rows[11].status).toBe("free");
  });

  it("treats past dates as fully past", () => {
    const rows = buildHourRows("2026-10-01", [], ist("2026-10-14T10:00:00"));
    expect(rows.every((r) => r.status === "past")).toBe(true);
  });
});

describe("freeUntil / overlaps", () => {
  it("finds end of free window", () => {
    const booked = [{ from: 1080, to: 1170 }];
    expect(freeUntil(600, booked)).toBe(1080);
    expect(freeUntil(1170, booked)).toBe(1440);
  });

  it("detects overlaps but not touching bookings", () => {
    const list = [{ id: "a", start: ist("2026-10-14T18:00:00"), end: ist("2026-10-14T19:00:00") }];
    expect(overlaps(ist("2026-10-14T19:00:00"), ist("2026-10-14T20:00:00"), list)).toBe(false);
    expect(overlaps(ist("2026-10-14T18:30:00"), ist("2026-10-14T20:00:00"), list)).toBe(true);
    expect(overlaps(ist("2026-10-14T18:30:00"), ist("2026-10-14T20:00:00"), list, "a")).toBe(false);
  });
});
