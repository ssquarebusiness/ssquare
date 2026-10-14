import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import gu from "../../messages/gu.json";
import hi from "../../messages/hi.json";

type Tree = { [k: string]: string | string[] | Tree };

function flatten(obj: Tree, prefix = ""): Record<string, string | string[]> {
  return Object.entries(obj).reduce<Record<string, string | string[]>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string" || Array.isArray(v)) acc[key] = v;
    else Object.assign(acc, flatten(v, key));
    return acc;
  }, {});
}

/** Top-level ICU argument names and rich-text tags, e.g. {name}, {count, plural…}, <icon>. */
function placeholders(s: string) {
  const args = new Set<string>();
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{") {
      if (depth === 0) args.add(s.slice(i + 1).match(/^\s*(\w+)/)?.[1] ?? "");
      depth++;
    } else if (s[i] === "}") depth--;
  }
  for (const m of s.matchAll(/<(\w+)>/g)) args.add(`<${m[1]}>`);
  return [...args].sort();
}

const base = flatten(en as Tree);

describe.each([["gu", gu], ["hi", hi]] as const)("messages/%s.json", (_, messages) => {
  const flat = flatten(messages as Tree);

  it("has exactly the same keys as English", () => {
    expect(Object.keys(flat).sort()).toEqual(Object.keys(base).sort());
  });

  it("keeps the same placeholders as English", () => {
    for (const [key, value] of Object.entries(base)) {
      if (typeof value !== "string") {
        expect((flat[key] as string[]).length, key).toBe(value.length);
        continue;
      }
      expect(placeholders(flat[key] as string), key).toEqual(placeholders(value));
    }
  });
});
