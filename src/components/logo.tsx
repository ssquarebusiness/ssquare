import { cn } from "@/lib/utils";

/** SSquare mark: "S²" on turf green with a pickleball-lime square. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} role="img" aria-label="SSquare">
      <rect width="64" height="64" rx="14" fill="#0b3d2e" />
      <rect x="36" y="8" width="20" height="20" rx="6" fill="#d4f53c" />
      <path d="M43.2 23.5h8.6v-2.2h-5.2l2.9-2.6c1.5-1.4 2.2-2.4 2.2-3.7 0-2-1.6-3.3-3.8-3.3-2 0-3.5 1-4.1 2.8l2.1.8c.4-1 1-1.5 1.9-1.5 1 0 1.5.6 1.5 1.4 0 .8-.5 1.5-1.6 2.6l-4.5 4z" fill="#0b3d2e" />
      <path d="M22.4 54c-5.6 0-9.6-2.3-11.4-5.8l4.6-3c1.4 2.3 3.8 3.6 6.8 3.6 2.8 0 4.4-1.1 4.4-2.8 0-1.8-1.4-2.5-5.5-3.6-5.4-1.4-9.1-3.4-9.1-8.4 0-4.8 4-8 9.7-8 4.5 0 7.9 1.7 9.8 4.8l-4.4 3c-1.2-1.8-3-2.7-5.3-2.7-2.4 0-3.8 1-3.8 2.5 0 1.7 1.3 2.3 5.2 3.4 5.6 1.5 9.5 3.4 9.5 8.6 0 4.9-4 8.4-10.5 8.4z" fill="#ffffff" />
    </svg>
  );
}

export function Wordmark({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo />
      <span className={cn("font-display text-xl font-bold tracking-tight", dark ? "text-white" : "text-brand-900")}>
        SSquare
      </span>
    </span>
  );
}
