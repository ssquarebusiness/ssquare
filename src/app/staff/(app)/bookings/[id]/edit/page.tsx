import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/server";
import { EditBooking } from "@/features/bookings/components/edit-booking";

export const metadata: Metadata = { title: "Edit booking" };

/** Owners only — caretakers are sent back to Home. */
export default async function EditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("owner");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <EditBooking id={id} />;
}
