import type { Permission } from "@/config/permissions";
import type { CourtSlug, PaymentMethod } from "@/config/business";
import type { Locale } from "@/i18n/routing";

export type Role = "owner" | "caretaker";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  permissions: Permission[];
  locale: Locale;
  is_active: boolean;
};

export type BookingStatus = "confirmed" | "completed" | "cancelled";

export type Booking = {
  id: string;
  code: string;
  court_slug: CourtSlug;
  sport: string | null;
  /** Optional — shown as "Unknown customer" when empty. */
  customer_name: string | null;
  /** Optional 10-digit mobile number. */
  customer_phone: string | null;
  customer_email: string | null;
  start_at: string;
  end_at: string;
  total_amount: number;
  extra_amount: number;
  status: BookingStatus;
  booked_by: string | null;
  created_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  advance_action: "kept" | "refunded" | null;
  notes: string | null;
  created_at: string;
};

/** Row of the `booking_summary` view. */
export type BookingSummary = Booking & { paid_amount: number; remaining_amount: number };

export type PaymentKind = "advance" | "settlement" | "refund";

export type Payment = {
  id: string;
  booking_id: string;
  kind: PaymentKind;
  method: PaymentMethod;
  amount: number;
  received_by: string;
  recorded_by: string;
  screenshot_path: string | null;
  note: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  spent_on: string;
  amount: number;
  category: string;
  description: string;
  expense_by: string;
  payment_method: string;
  created_by: string;
  created_at: string;
};

export type Court = {
  slug: CourtSlug;
  name_i18n: Record<Locale, string>;
  sports: string[];
  is_active: boolean;
  sort: number;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

/** Result shape returned by server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
