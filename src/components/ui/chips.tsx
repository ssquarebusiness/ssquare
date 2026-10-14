"use client";
import { cn } from "@/lib/utils";

/** Single-select chip group (court, duration, method…). */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = "md",
  name,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  name?: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full border font-semibold transition-colors",
              size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-[15px]",
              active
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-400",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
