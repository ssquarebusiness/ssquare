/** Central list of TanStack Query keys — invalidate by prefix after changes. */
export const qk = {
  profiles: ["profiles"] as const,
  courts: ["courts"] as const,
  rates: ["rates"] as const,
  bookings: ["bookings"] as const,
  bookingsDay: (date: string) => ["bookings", "day", date] as const,
  bookingsRange: (from: string, to: string) => ["bookings", "range", from, to] as const,
  booking: (id: string) => ["bookings", "one", id] as const,
  payments: ["payments"] as const,
  paymentsRange: (from: string, to: string) => ["payments", "range", from, to] as const,
  bookingPayments: (id: string) => ["payments", "booking", id] as const,
  myCollection: (date: string) => ["payments", "mine", date] as const,
  expenses: ["expenses"] as const,
  expensesRange: (from: string, to: string) => ["expenses", "range", from, to] as const,
  notifications: ["notifications"] as const,
};
