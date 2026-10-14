import { describe, expect, it } from "vitest";
import { eachDay, presetRange } from "./ranges";

const now = new Date("2026-10-14T10:00:00+05:30"); // Wednesday

describe("presetRange", () => {
  it("computes week (Mon start) and months", () => {
    expect(presetRange("thisWeek", now)).toEqual({ from: "2026-10-12", to: "2026-10-14" });
    expect(presetRange("thisMonth", now)).toEqual({ from: "2026-10-01", to: "2026-10-14" });
    expect(presetRange("lastMonth", now)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(presetRange("yesterday", now)).toEqual({ from: "2026-10-13", to: "2026-10-13" });
  });
  it("lists every day", () => {
    expect(eachDay({ from: "2026-09-29", to: "2026-10-02" })).toHaveLength(4);
  });
});
