/** Maps database / RPC errors to translation keys under `errors.*`. */
export function errorKey(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "generic";
  if (error.code === "23P01") return "slotTaken";
  if (error.code === "42501" || /FORBIDDEN/.test(error.message ?? "")) return "forbidden";
  const known = ["BOOKING_NOT_FOUND", "BOOKING_NOT_ACTIVE", "INVALID_AMOUNT", "ADVANCE_TOO_HIGH"];
  const hit = known.find((k) => error.message?.includes(k));
  if (hit) return hit.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  if (error.code === "23514") return "invalidData";
  return "generic";
}
