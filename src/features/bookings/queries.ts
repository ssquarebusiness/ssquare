"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { qk } from "@/lib/query-keys";
import { istDateRange, istDayRange, type DateStr } from "@/lib/time";
import type { BookingSummary, Payment } from "@/lib/types";
import type { PaymentMethod } from "@/config/business";

/** Bookings that overlap an IST day (includes late-night ones crossing midnight). */
export function useDayBookings(date: DateStr, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.bookingsDay(date),
    enabled: opts.enabled ?? true,
    queryFn: async () => {
      const { start, end } = istDayRange(date);
      const { data, error } = await getSupabase()
        .from("booking_summary")
        .select("*")
        .lt("start_at", end.toISOString())
        .gt("end_at", start.toISOString())
        .order("start_at");
      if (error) throw error;
      return data as BookingSummary[];
    },
  });
}

/** Bookings starting within [from, to] (IST, inclusive). */
export function useRangeBookings(from: DateStr, to: DateStr, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.bookingsRange(from, to),
    enabled: opts.enabled ?? true,
    queryFn: () => fetchRangeBookings(from, to),
  });
}

export async function fetchRangeBookings(from: DateStr, to: DateStr) {
  const { start, end } = istDateRange(from, to);
  const { data, error } = await getSupabase()
    .from("booking_summary")
    .select("*")
    .gte("start_at", start.toISOString())
    .lt("start_at", end.toISOString())
    .order("start_at");
  if (error) throw error;
  return data as BookingSummary[];
}

/** Public-safe busy times for a day (used by the booking form to show conflicts). */
export function useBusyTimes(date: DateStr) {
  return useQuery({
    queryKey: [...qk.bookingsDay(date), "busy"],
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc("get_public_availability", { p_date: date });
      if (error) throw error;
      return data as { court_slug: string; start_at: string; end_at: string }[];
    },
  });
}

export function useBookingPayments(bookingId: string | null) {
  return useQuery({
    queryKey: qk.bookingPayments(bookingId ?? ""),
    enabled: Boolean(bookingId),
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId!)
        .order("created_at");
      if (error) throw error;
      return data as Payment[];
    },
  });
}

/** Payments received within [from, to] (IST), for owners' dashboard, analytics and reports. */
export function useRangePayments(from: DateStr, to: DateStr, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.paymentsRange(from, to),
    enabled: opts.enabled ?? true,
    queryFn: () => fetchRangePayments(from, to),
  });
}

export async function fetchRangePayments(from: DateStr, to: DateStr) {
  const { start, end } = istDateRange(from, to);
  const { data, error } = await getSupabase()
    .from("payments")
    .select("*")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at");
  if (error) throw error;
  return data as Payment[];
}

/** What the logged-in user collected on a day (UPI / Cash). */
export function useMyCollection(date: DateStr) {
  return useQuery({
    queryKey: qk.myCollection(date),
    queryFn: async () => {
      const { data, error } = await getSupabase().rpc("my_collection", { p_date: date });
      if (error) throw error;
      const rows = (data ?? []) as { method: PaymentMethod; amount: number }[];
      const get = (m: PaymentMethod) => Number(rows.find((r) => r.method === m)?.amount ?? 0);
      return { upi: get("upi"), cash: get("cash") };
    },
  });
}

/** Last booking for a phone number — fills the name for repeat customers. */
export async function findCustomerByPhone(phone: string) {
  const { data } = await getSupabase()
    .from("bookings")
    .select("customer_name, customer_email")
    .eq("customer_phone", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ customer_name: string | null; customer_email: string | null }>();
  return data;
}
