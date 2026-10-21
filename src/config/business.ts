/**
 * Business rules that change from time to time.
 * Rates are NOT here — owners edit them from the app (Settings → Rates).
 */

export const COURTS = ["turf", "pickleball"] as const;
export type CourtSlug = (typeof COURTS)[number];

export const SPORTS = ["cricket", "football", "pickleball"] as const;
export type Sport = (typeof SPORTS)[number];

/**
 * Sports played on each court (turf is common for cricket & football).
 * The first sport is the default when a court is chosen. Prices are set per sport.
 */
export const COURT_SPORTS: Record<CourtSlug, readonly Sport[]> = {
  turf: ["cricket", "football"],
  pickleball: ["pickleball"],
};

export const businessConfig = {
  /** Start-time picker step in the booking form. */
  slotStepMinutes: 15,

  /** Quick duration chips in the booking form (minutes). */
  durationPresets: [60, 90, 120, 150, 180],

  /** Longest booking allowed (minutes). */
  maxBookingMinutes: 12 * 60,

  /** How far ahead the public can check availability (days). */
  publicAvailabilityDaysAhead: 90,

  /** Number of days shown in the quick date strip. */
  dateStripDays: 7,

  /** Day parts on the public availability view. Hours are 0–24 in IST. */
  dayParts: [
    { key: "night", from: 0, to: 6 },
    { key: "morning", from: 6, to: 12 },
    { key: "afternoon", from: 12, to: 16 },
    { key: "evening", from: 16, to: 24 },
  ],

  /** Weekend days for rate rules (0 = Sunday … 6 = Saturday). */
  weekendDays: [0, 6],

  /** Quick-add chips for extra items when completing a booking. Price in ₹. */
  extraItems: [
    { key: "water", price: 20 },
    { key: "coldDrink", price: 40 },
  ],

  paymentMethods: ["upi", "cash"] as const,

  expenseCategories: [
    "maintenance",
    "electricity",
    "salary",
    "equipment",
    "cleaning",
    "water",
    "marketing",
    "rent",
    "other",
  ],

  expensePaymentMethods: ["cash", "upi", "card", "bank"] as const,

  /** UPI screenshots older than this are deleted automatically to save storage. */
  screenshotRetentionDays: 30,

  /** Screenshot compression before upload. */
  screenshot: { maxSizeMB: 0.08, maxWidthOrHeight: 1280 },

  /**
   * Who triggers push notifications to owners:
   *  "non-owner" → only when a caretaker takes payment / completes / cancels
   *  "everyone"  → also when the other owner does it
   */
  notifyOwnersOn: "non-owner" as "non-owner" | "everyone",

  /** Data refresh interval of the public availability view (ms). */
  publicRefreshMs: 60_000,
} as const;

export type PaymentMethod = (typeof businessConfig.paymentMethods)[number];
export type ExpensePaymentMethod = (typeof businessConfig.expensePaymentMethods)[number];
