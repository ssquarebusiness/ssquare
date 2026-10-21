"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, CalendarPlus, IndianRupee, Receipt, Smartphone, Wallet } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { buttonClass, Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Chips } from "@/components/ui/chips";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { BookingCard } from "@/features/bookings/components/booking-card";
import { BookingDetailSheet } from "@/features/bookings/components/booking-detail-sheet";
import { useMyCollection, useRangePayments, useTodayBookings } from "@/features/bookings/queries";
import { useCourtOptions, useNameOf } from "@/features/common/queries";
import { ExpenseSheet } from "@/features/expenses/components/expense-sheet";
import { useExpenses } from "@/features/expenses/queries";
import { formatINR, sum } from "@/lib/money";
import { splitPayments } from "@/lib/payments";
import { formatDate, istDateStr } from "@/lib/time";
import { useCan, useIsOwner, useStaff } from "./context";

/** Home screen. Owners get the money dashboard; caretakers get a simple "today" view. */
export function StaffHome() {
  const t = useTranslations("staff.home");
  const locale = useLocale() as Locale;
  const me = useStaff();
  const isOwner = useIsOwner();
  const can = useCan();
  const today = istDateStr();
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">{t("greeting", { name: me.display_name })}</h1>
        <p className="text-zinc-500">{formatDate(today, locale, { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {isOwner ? <OwnerCards today={today} /> : <MyCollectionCard today={today} />}

      {(can("create_booking") || can("expenses")) && (
        <div className="grid grid-cols-2 gap-3">
          {can("create_booking") && (
            <Link href="/staff/bookings/new" className={buttonClass("primary", "lg")}>
              <CalendarPlus className="size-5" /> {t("addBooking")}
            </Link>
          )}
          {can("expenses") && (
            <Button variant="secondary" size="lg" onClick={() => setExpenseOpen(true)}>
              <Receipt className="size-5" /> {t("addExpense")}
            </Button>
          )}
        </div>
      )}

      <TodayBookings today={today} />
      {can("expenses") && <ExpenseSheet open={expenseOpen} onClose={() => setExpenseOpen(false)} />}
    </div>
  );
}

function OwnerCards({ today }: { today: string }) {
  const t = useTranslations("staff.home");
  const nameOf = useNameOf();
  const { data: payments, isLoading } = useRangePayments(today, today);
  const { data: bookings } = useTodayBookings(today);
  const { data: expenses } = useExpenses(today, today);

  const split = useMemo(() => splitPayments(payments ?? []), [payments]);
  const pending = sum(
    (bookings ?? []).filter((b) => b.status === "confirmed"),
    (b) => Math.max(b.remaining_amount, 0),
  );
  const spent = sum(expenses ?? [], (e) => e.amount);
  const cashRows = [...split.cashBy.entries()].filter(([, v]) => v !== 0);

  return (
    <div className="space-y-3">
      <Card className="bg-gradient-to-br from-brand-800 to-brand-950 text-white">
        <CardTitle className="text-brand-200">{t("collectedToday")}</CardTitle>
        <p className="mt-1 font-display text-4xl font-bold">{isLoading ? <Spinner /> : formatINR(split.total)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="flex items-center gap-1.5 text-sm text-brand-200"><Smartphone className="size-4" /> {t("upi")}</p>
            <p className="text-xl font-bold">{formatINR(split.upi)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="flex items-center gap-1.5 text-sm text-brand-200"><Wallet className="size-4" /> {t("cash")}</p>
            <p className="text-xl font-bold">{formatINR(split.cash)}</p>
          </div>
        </div>
        {cashRows.length > 0 && (
          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-brand-200 uppercase">{t("cashWith")}</p>
            <ul className="space-y-1">
              {cashRows.map(([id, amount]) => (
                <li key={id} className="flex justify-between text-[15px]">
                  <span>{nameOf(id)}</span>
                  <span className="font-semibold">{formatINR(amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardTitle className="flex items-center gap-1.5"><IndianRupee className="size-4" /> {t("pendingToday")}</CardTitle>
          <p className="mt-1 text-2xl font-bold text-rose-600">{formatINR(pending)}</p>
        </Card>
        <Card>
          <CardTitle className="flex items-center gap-1.5"><Receipt className="size-4" /> {t("expensesToday")}</CardTitle>
          <p className="mt-1 text-2xl font-bold">{formatINR(spent)}</p>
        </Card>
      </div>
    </div>
  );
}

function MyCollectionCard({ today }: { today: string }) {
  const t = useTranslations("staff.home");
  const { data, isLoading } = useMyCollection(today);
  return (
    <Card className="bg-gradient-to-br from-brand-800 to-brand-950 text-white">
      <CardTitle className="text-brand-200">{t("myCollection")}</CardTitle>
      {isLoading ? <Spinner className="mt-2" /> : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-3">
            <p className="flex items-center gap-1.5 text-sm text-brand-200"><Smartphone className="size-4" /> {t("upi")}</p>
            <p className="text-2xl font-bold">{formatINR(data?.upi)}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="flex items-center gap-1.5 text-sm text-brand-200"><Wallet className="size-4" /> {t("cash")}</p>
            <p className="text-2xl font-bold">{formatINR(data?.cash)}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function TodayBookings({ today }: { today: string }) {
  const t = useTranslations("staff.home");
  const locale = useLocale() as Locale;
  const courtOptions = useCourtOptions();
  const { data, isLoading } = useTodayBookings(today);
  const [court, setCourt] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = (data ?? []).filter((b) => court === "all" || b.court_slug === court);
  // Active first (by time), then completed, then cancelled.
  const order = { confirmed: 0, completed: 1, cancelled: 2 } as const;
  const sorted = [...list].sort((a, b) => order[a.status] - order[b.status] || a.start_at.localeCompare(b.start_at));
  const selected = data?.find((b) => b.id === selectedId) ?? null;
  const activeCount = list.filter((b) => b.status === "confirmed").length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CalendarCheck className="size-5 text-brand-700" /> {t("todayBookings")}
        </h2>
        <span className="text-sm text-zinc-500">{t("activeCount", { count: activeCount })}</span>
      </div>
      <Chips size="sm" name={t("todayBookings")} value={court} onChange={setCourt}
        options={[{ value: "all", label: t("all") }, ...courtOptions]} />
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : sorted.length === 0 ? (
        <Empty title={t("noBookings")} />
      ) : (
        <ul className="space-y-2">
          {sorted.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} onOpen={() => setSelectedId(b.id)}
                showDate={istDateStr(new Date(b.start_at)) > today ? t("lateNight", { date: formatDate(new Date(b.start_at), locale, { weekday: "short", day: "numeric" }) }) : undefined} />
            </li>
          ))}
        </ul>
      )}
      <BookingDetailSheet booking={selected} onClose={() => setSelectedId(null)} />
    </section>
  );
}
