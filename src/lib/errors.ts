/**
 * Maps database / RPC errors to translation keys under `errors.*`.
 * Unexpected errors are logged on the server (with `where`) so they can be diagnosed.
 */
export function errorKey(error: { code?: string; message?: string; details?: string } | null | undefined, where?: string): string {
  const key = mapError(error);
  if (key === "generic" || key === "setupIncomplete") console.error(`[${where ?? "db"}]`, error);
  return key;
}

function mapError(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "generic";
  // Foreign key to courts / sports missing → database setup (migrations) not complete.
  if (error.code === "23503") return "setupIncomplete";
  // Function or table not found → a migration has not been run.
  if (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42P01") return "setupIncomplete";
  if (error.code === "23P01") return "slotTaken";
  if (error.code === "42501" || /FORBIDDEN/.test(error.message ?? "")) return "forbidden";
  const known = ["BOOKING_NOT_FOUND", "BOOKING_NOT_ACTIVE", "INVALID_AMOUNT", "ADVANCE_TOO_HIGH", "ADVANCE_NOT_EDITABLE"];
  const hit = known.find((k) => error.message?.includes(k));
  if (hit) return hit.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  if (error.code === "23514") return "invalidData";
  return "generic";
}
