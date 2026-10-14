import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { isDateStr, istDateStr } from "@/lib/time";
import { BookingsBrowser } from "@/features/bookings/components/bookings-browser";

export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  await requireStaff("all_bookings");
  const { date } = await searchParams;
  return <BookingsBrowser initialDate={isDateStr(date) ? date : istDateStr()} />;
}
