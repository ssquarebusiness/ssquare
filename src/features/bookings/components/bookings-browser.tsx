"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Empty } from "@/components/ui/empty";
import { DatePickerButton } from "@/components/ui/date-picker-button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCan } from "@/features/staff/context";
import { useCourtOptions } from "@/features/common/queries";
import { formatINR, sum } from "@/lib/money";
import { getSupabase } from "@/lib/supabase/client";
import { addDays, formatDate, istDateStr, type DateStr } from "@/lib/time";
import type { BookingStatus, BookingSummary } from "@/lib/types";
import { useDayBookings } from "../queries";
import { BookingCard } from "./booking-card";
import { BookingDetailSheet } from "./booking-detail-sheet";

/** Bookings of any day (past or future) + search by name / phone. */
export function BookingsBrowser({ initialDate }: { initialDate: DateStr }) {
  const t = useTranslations("staff.bookings");
  const ts = useTranslations("common.status");
  const locale = useLocale() as Locale;
  const can = useCan();
  const courtOptions = useCourtOptions();
  const [date, setDate] = useState(initialDate);
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [court, setCourt] = useState("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const term = q.trim();
  const searching = term.length >= 3;
  const day = useDayBookings(date, { enabled: !searching });
  const search = useQuery({
    queryKey: ["bookings", "search", term],
    enabled: searching,
    queryFn: async () => {
      const digits = term.replace(/\D/g, "");
      const query = getSupabase().from("booking_summary").select("*").order("start_at", { ascending: false }).limit(50);
      const { data, error } = digits.length >= 3
        ? await query.like("customer_phone", `%${digits}%`)
        : await query.ilike("customer_name", `%${term}%`);
      if (error) throw error;
      return data as BookingSummary[];
    },
  });

  const source = searching ? search : day;
  const list = (source.data ?? []).filter(
    (b) => (status === "all" || b.status === status) && (court === "all" || b.court_slug === court),
  );
  const selected = source.data?.find((b) => b.id === selectedId) ?? null;
  const active = list.filter((b) => b.status !== "cancelled");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
        {can("create_booking") && (
          <Link href={`/staff/bookings/new?date=${date}`} className={buttonClass("primary", "sm")}>
            <Plus className="size-4" /> {t("add")}
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-zinc-400" />
        <Input type="search" placeholder={t("searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" />
      </div>

      {!searching && (
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} aria-label={t("prevDay")} className={buttonClass("outline", "icon")}>
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1 [&>span]:flex [&>span]:w-full">
            <DatePickerButton value={date} onChange={setDate} label={t("pickDate")}
              className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 text-center font-semibold">
              {date === istDateStr() ? `${t("today")} · ` : ""}{formatDate(date, locale)}
            </DatePickerButton>
          </div>
          <button onClick={() => setDate(addDays(date, 1))} aria-label={t("nextDay")} className={buttonClass("outline", "icon")}>
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}

      <div className="no-scrollbar -mx-4 space-y-2 overflow-x-auto px-4">
        <Chips size="sm" name={t("status")} value={status} onChange={setStatus}
          options={[{ value: "all" as const, label: t("all") }, ...(["confirmed", "completed", "cancelled"] as const).map((s) => ({ value: s, label: ts(s) }))]} />
        <Chips size="sm" name={t("court")} value={court} onChange={setCourt}
          options={[{ value: "all", label: t("allCourts") }, ...courtOptions]} />
      </div>

      {!searching && active.length > 0 && (
        <p className="text-sm text-zinc-600">
          {t("summary", { count: active.length, value: formatINR(sum(active, (b) => b.total_amount + b.extra_amount)), paid: formatINR(sum(active, (b) => b.paid_amount)) })}
        </p>
      )}

      {source.isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : list.length === 0 ? (
        <Empty title={searching ? t("noResults") : t("empty")} />
      ) : (
        <ul className="space-y-2">
          {list.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} onOpen={() => setSelectedId(b.id)}
                showDate={searching ? formatDate(new Date(b.start_at), locale, { day: "numeric", month: "short" }) : undefined} />
            </li>
          ))}
        </ul>
      )}
      <BookingDetailSheet booking={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
