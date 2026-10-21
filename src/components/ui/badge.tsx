import { cn } from "@/lib/utils";

const tones = {
  green: "bg-free-soft text-free-ink",
  red: "bg-booked-soft text-booked-ink",
  amber: "bg-gold-50 text-gold-800",
  blue: "bg-[#e9eef7] text-[#3f5f9c]",
  gray: "bg-zinc-100 text-zinc-700",
} as const;

export function Badge({ tone = "gray", className, children }: { tone?: keyof typeof tones; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
