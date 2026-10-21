import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { COURTS, type CourtSlug } from "@/config/business";
import { requireStaff } from "@/lib/auth/server";
import { isDateStr, istDateStr } from "@/lib/time";
import { BookingForm } from "@/features/bookings/components/booking-form";

export const metadata: Metadata = { title: "New booking" };

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ date?: string; court?: string }> }) {
  await requireStaff("create_booking");
  const t = await getTranslations("staff.bookingForm");
  const { date, court } = await searchParams;
  const initialCourt = (COURTS as readonly string[]).includes(court ?? "") ? (court as CourtSlug) : undefined;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
      <BookingForm initialDate={isDateStr(date) ? date : istDateStr()} initialCourt={initialCourt} />
    </div>
  );
}
