/**
 * Permissions that owners can give to caretaker accounts (Settings → Staff).
 * Owners always have every permission. Keys must match the SQL helper `has_perm()`.
 */
export const PERMISSIONS = [
  "today_bookings", // see today's bookings, take payment, complete, cancel
  "all_bookings", // see & handle bookings of any date (history, future)
  "create_booking", // add new bookings
  "expenses", // add & see expenses
  "analytics", // see analytics
  "reports", // download Excel / PDF reports
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const DEFAULT_CARETAKER_PERMISSIONS: Permission[] = ["today_bookings"];

/** Which permission a staff route needs. "owner" = owners only. Longest prefix wins. */
export const ROUTE_PERMISSIONS: { prefix: string; need: Permission | "owner" | null }[] = [
  { prefix: "/staff/bookings/new", need: "create_booking" },
  { prefix: "/staff/bookings", need: "all_bookings" },
  { prefix: "/staff/expenses", need: "expenses" },
  { prefix: "/staff/analytics", need: "analytics" },
  { prefix: "/staff/reports", need: "reports" },
  { prefix: "/staff/settings", need: "owner" },
  { prefix: "/staff/more", need: null },
  { prefix: "/staff/notifications", need: null },
  { prefix: "/staff", need: null },
];

export function routePermission(pathname: string) {
  return (
    [...ROUTE_PERMISSIONS]
      .sort((a, b) => b.prefix.length - a.prefix.length)
      .find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))?.need ?? null
  );
}
