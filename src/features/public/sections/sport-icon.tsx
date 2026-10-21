import type { Sport } from "@/config/business";

/** Simple line icons for the three sports (lucide has no cricket / pickleball icons). */
export function SportIcon({ sport, className = "size-5" }: { sport: Sport | string; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (sport === "cricket")
    return <svg {...common}><path d="M14 4l6 6-9 9-4 1 1-4z" /><path d="M4 20l3-3" /><circle cx="18" cy="18" r="2" /></svg>;
  if (sport === "football")
    return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7l4 3-1.5 4.5h-5L8 10z" /></svg>;
  return <svg {...common}><rect x="5" y="3" width="11" height="13" rx="5.5" transform="rotate(-30 10.5 9.5)" /><path d="M13 15l5 6" /><circle cx="19" cy="6" r="2" /></svg>;
}
