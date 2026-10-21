"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileSpreadsheet, FileText } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { initialRange, RangePicker } from "@/components/staff/range-picker";
import { fetchRangeBookings, fetchRangePayments } from "@/features/bookings/queries";
import { useCourtName, useNameOf } from "@/features/common/queries";
import { fetchExpenses } from "@/features/expenses/queries";
import { saveFile } from "@/lib/download";
import { buildReport } from "@/lib/reports/data";
import { getSupabase } from "@/lib/supabase/client";
import { formatDate } from "@/lib/time";
import type { Payment } from "@/lib/types";

async function paymentsOf(bookingIds: string[]) {
  const out: Payment[] = [];
  for (let i = 0; i < bookingIds.length; i += 150) {
    const { data, error } = await getSupabase().from("payments").select("*").in("booking_id", bookingIds.slice(i, i + 150));
    if (error) throw error;
    out.push(...(data as Payment[]));
  }
  return out;
}

/** Download bookings, payments & expenses of a day or date range as Excel or PDF. */
export function ReportsView() {
  const t = useTranslations("staff.reports");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const toast = useToast();
  const nameOf = useNameOf();
  const courtName = useCourtName();
  const [range, setRange] = useState(initialRange("today"));
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);

  const generate = async (kind: "xlsx" | "pdf") => {
    setBusy(kind);
    try {
      const [bookings, rangePayments, expenses] = await Promise.all([
        fetchRangeBookings(range.from, range.to),
        fetchRangePayments(range.from, range.to),
        fetchExpenses(range.from, range.to),
      ]);
      const bookingPayments = await paymentsOf(bookings.map((b) => b.id));
      const report = buildReport({ from: range.from, to: range.to, bookings, bookingPayments, rangePayments, expenses, nameOf, courtName });
      const period = range.from === range.to ? range.from : `${range.from}_to_${range.to}`;
      const title = `Report: ${range.from === range.to ? formatDate(range.from) : `${formatDate(range.from)} - ${formatDate(range.to)}`}`;
      const blob = kind === "xlsx"
        ? await (await import("@/lib/reports/excel")).buildExcel(report, title)
        : await (await import("@/lib/reports/pdf")).buildPdf(report, title);
      const res = await saveFile(blob, `SSquare_${period}.${kind}`);
      if (res !== "cancelled") toast(t("ready"));
    } catch {
      toast(te("generic"), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
      <p className="text-zinc-600">{t("help")}</p>
      <RangePicker value={range} onChange={setRange} />
      <Card className="text-center">
        <p className="text-sm text-zinc-500">{t("period")}</p>
        <p className="font-semibold">
          {range.from === range.to ? formatDate(range.from, locale) : `${formatDate(range.from, locale)} → ${formatDate(range.to, locale)}`}
        </p>
      </Card>
      <div className="grid gap-3">
        <Button size="xl" loading={busy === "xlsx"} disabled={!!busy} onClick={() => generate("xlsx")}>
          <FileSpreadsheet className="size-6" /> {t("excel")}
        </Button>
        <Button size="xl" variant="secondary" loading={busy === "pdf"} disabled={!!busy} onClick={() => generate("pdf")}>
          <FileText className="size-6" /> {t("pdf")}
        </Button>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-500">
        <li>{t("includes1")}</li>
        <li>{t("includes2")}</li>
        <li>{t("includes3")}</li>
        <li>{t("iosNote")}</li>
      </ul>
    </div>
  );
}
