import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * SSquare logo images (generated from scripts/assets/logo-full.webp by scripts/generate-icons.mjs).
 * - Logo:     the emblem (shield, balls, "S") — readable at small sizes (header, app bar).
 * - FullLogo: the complete artwork with "SQUARE — Cricket Box | Pickleball | Football Turf".
 */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/logo-emblem.webp"
      alt="SSquare"
      width={512}
      height={512}
      priority={priority}
      sizes="48px"
      className={cn("h-9 w-9 rounded-[10px]", className)}
    />
  );
}

export function FullLogo({ className, priority, sizes = "(min-width: 768px) 360px, 240px" }: { className?: string; priority?: boolean; sizes?: string }) {
  return (
    <Image
      src="/images/logo.webp"
      alt="SSquare — Cricket Box, Pickleball, Football Turf"
      width={900}
      height={900}
      priority={priority}
      sizes={sizes}
      className={cn("h-auto w-60 rounded-3xl", className)}
    />
  );
}

export function Wordmark({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo priority />
      <span className={cn("text-[19px] font-extrabold tracking-tight", dark ? "text-white" : "text-ink")}>
        SSquare
      </span>
    </span>
  );
}
