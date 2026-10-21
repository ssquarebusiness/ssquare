"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A custom-looking button that opens the phone's / browser's native date picker.
 * Uses input.showPicker() (Chrome, Edge, Safari 16+, Firefox) and falls back to focusing the input.
 */
export function DatePickerButton({
  value,
  onChange,
  min,
  max,
  label,
  className,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const open = () => {
    const input = ref.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // showPicker can throw (e.g. inside some in-app browsers) — fall back below.
    }
    input.focus();
    input.click();
  };

  return (
    <span className="relative inline-flex">
      <button type="button" onClick={open} aria-label={label} className={cn(className)}>
        {children}
      </button>
      <input
        ref={ref}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value}
        min={min}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px -translate-x-1/2 opacity-0"
      />
    </span>
  );
}
