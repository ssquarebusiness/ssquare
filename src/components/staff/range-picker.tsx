"use client";
import { useTranslations } from "next-intl";
import { Chips } from "@/components/ui/chips";
import { Input } from "@/components/ui/input";
import { presetRange, RANGE_PRESETS, type DateRange, type RangePreset } from "@/lib/ranges";
import { istDateStr } from "@/lib/time";

export type RangeState = DateRange & { preset: RangePreset };

export function initialRange(preset: Exclude<RangePreset, "custom"> = "today"): RangeState {
  return { preset, ...presetRange(preset) };
}

/** Preset chips (Today, This week, …) + custom From/To dates. */
export function RangePicker({ value, onChange, presets = RANGE_PRESETS }: {
  value: RangeState;
  onChange: (v: RangeState) => void;
  presets?: readonly RangePreset[];
}) {
  const t = useTranslations("staff.range");
  return (
    <div className="space-y-3">
      <Chips
        size="sm"
        name={t("label")}
        value={value.preset}
        onChange={(p) => onChange(p === "custom" ? { ...value, preset: p } : { preset: p, ...presetRange(p) })}
        options={presets.map((p) => ({ value: p, label: t(p) }))}
      />
      {value.preset === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm font-medium text-zinc-700">
            {t("from")}
            <Input type="date" value={value.from} max={value.to}
              onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm font-medium text-zinc-700">
            {t("to")}
            <Input type="date" value={value.to} min={value.from} max={istDateStr(new Date(Date.now() + 365 * 864e5))}
              onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}
