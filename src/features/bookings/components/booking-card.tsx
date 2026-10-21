"use client";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Clock } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { useCourtName, useCustomerLabels } from "@/features/common/queries";
import { formatINR } from "@/lib/money";
import { formatTimeRange } from "@/lib/time";
import type { BookingSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: BookingSummary["status"] }) {
  const t = useTranslations("common.status");
  const tone = status === "completed" ? "green" : status === "cancelled" ? "red" : "blue";
  return <Badge tone={tone}>{t(status)}</Badge>;
}

/** One booking row in Today / Bookings lists. Big tap target. */
export function BookingCard({ booking, onOpen, showDate }: { booking: BookingSummary; onOpen: () => void; showDate?: string }) {
  const t = useTranslations("staff.booking");
  const locale = useLocale() as Locale;
  const courtName = useCourtName();
  const customer = useCustomerLabels();
  const due = booking.status === "confirmed" && booking.remaining_amount > 0;

  return (
    <button
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.99]",
        booking.status === "cancelled" ? "border-zinc-200 opacity-60" : "border-zinc-200 hover:border-zinc-300",
      )}
    >
      <div className={cn("w-1.5 self-stretch rounded-full", booking.court_slug === "turf" ? "bg-brand-500" : "bg-gold")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-bold text-zinc-900">{customer.name(booking.customer_name)}</p>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-600">
          <Clock className="size-3.5" />
          {showDate && <span>{showDate} ·</span>}
          {formatTimeRange(booking.start_at, booking.end_at, locale)}
        </p>
        <p className="text-sm text-zinc-500">{courtName(booking.court_slug)}</p>
      </div>
      <div className="text-right">
        {due ? (
          <>
            <p className="text-xs text-zinc-500">{t("toCollect")}</p>
            <p className="text-lg font-bold text-booked-ink">{formatINR(booking.remaining_amount)}</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-zinc-500">{formatINR(booking.total_amount + booking.extra_amount)}</p>
        )}
      </div>
      <ChevronRight className="size-5 shrink-0 text-zinc-400" />
    </button>
  );
}
