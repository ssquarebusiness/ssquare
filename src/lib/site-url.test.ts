import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL and keeps only the origin", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://ssquarenadiad.in/" })).toBe("https://ssquarenadiad.in");
  });
  it("adds https:// when missing", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "ssquarenadiad.in" })).toBe("https://ssquarenadiad.in");
  });
  it("ignores an empty value and falls back to the Vercel domain", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "  ", VERCEL_PROJECT_PRODUCTION_URL: "ssquare.vercel.app" })).toBe("https://ssquare.vercel.app");
  });
  it("skips invalid values", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://", VERCEL_URL: "ssquare-abc.vercel.app" })).toBe("https://ssquare-abc.vercel.app");
  });
  it("falls back to localhost", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
