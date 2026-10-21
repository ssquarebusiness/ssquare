"use client";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { getSupabase } from "@/lib/supabase/client";
import { qk } from "@/lib/query-keys";
import { istDateStr } from "@/lib/time";
import type { BookingSummary, Payment } from "@/lib/types";
import { BookingForm, type EditingBooking } from "./booking-form";

/** Loads a booking (+ its advance payment) and opens the booking form in edit mode. Owners only. */
export function EditBooking({ id }: { id: string }) {
  const t = useTranslations("staff.bookingForm");
  const te = useTranslations("errors");
  const { data, isLoading } = useQuery({
    queryKey: [...qk.booking(id), "edit"],
    // Always load fresh data so the owner edits the latest version.
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<EditingBooking | null> => {
      const supabase = getSupabase();
      const [b, p] = await Promise.all([
        supabase.from("booking_summary").select("*").eq("id", id).maybeSingle<BookingSummary>(),
        supabase.from("payments").select("*").eq("booking_id", id).eq("kind", "advance"),
      ]);
      if (b.error) throw b.error;
      if (!b.data) return null;
      const advances = (p.data ?? []) as Payment[];
      return { booking: b.data, advance: advances[0] ?? null };
    },
  });

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;
  if (!data || data.booking.status === "cancelled") return <Empty title={te("bookingNotActive")} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("editTitle")}</h1>
        <p className="text-sm text-zinc-500">{data.booking.code}</p>
      </div>
      <BookingForm initialDate={istDateStr(new Date(data.booking.start_at))} editing={data} />
    </div>
  );
}
