"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Camera, CheckCircle2, ImageIcon, Pencil, Phone, Plus, X, XCircle } from "lucide-react";
import { businessConfig } from "@/config/business";
import type { Locale } from "@/i18n/routing";
import { Button, buttonClass } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Field, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useCourtName, useCustomerLabels, useNameOf } from "@/features/common/queries";
import { useIsOwner } from "@/features/staff/context";
import { formatINR, parseAmount } from "@/lib/money";
import { qk } from "@/lib/query-keys";
import { formatDate, formatTime, formatTimeRange } from "@/lib/time";
import type { BookingSummary, Payment } from "@/lib/types";
import { cn, telHref, whatsappHref } from "@/lib/utils";
import { cancelBookingAction, completeBookingAction } from "../actions";
import { useBookingPayments } from "../queries";
import { proofUrl, uploadPaymentProof } from "../upload";
import { StatusBadge } from "./booking-card";
import { WhatsAppIcon } from "./booking-confirmation";

type Mode = "view" | "complete" | "cancel";

/** Booking details + "Take payment & complete" + "Cancel". Used by owners and the caretaker. */
export function BookingDetailSheet({ booking, onClose }: { booking: BookingSummary | null; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("view");
  const t = useTranslations("staff.booking");
  const customer = useCustomerLabels();
  const close = () => {
    setMode("view");
    onClose();
  };
  if (!booking) return null;

  const title =
    mode === "complete" ? t("completeTitle") : mode === "cancel" ? t("cancelTitle") : customer.name(booking.customer_name);

  return (
    <Sheet open onClose={close} title={title}>
      {mode === "view" && <DetailView booking={booking} onMode={setMode} />}
      {mode === "complete" && <CompleteForm booking={booking} onBack={() => setMode("view")} onDone={close} />}
      {mode === "cancel" && <CancelForm booking={booking} onBack={() => setMode("view")} onDone={close} />}
    </Sheet>
  );
}

function Row({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-zinc-500">{label}</span>
      <span className={cn("text-right", strong ? "text-lg font-bold" : "font-medium")}>{children}</span>
    </div>
  );
}

function DetailView({ booking: b, onMode }: { booking: BookingSummary; onMode: (m: Mode) => void }) {
  const customer = useCustomerLabels();
  const t = useTranslations("staff.booking");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const courtName = useCourtName();
  const nameOf = useNameOf();
  const isOwner = useIsOwner();
  const { data: payments, isLoading } = useBookingPayments(b.id);
  const active = b.status === "confirmed";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{b.code}</span>
        <StatusBadge status={b.status} />
      </div>

      {b.customer_phone ? (
        <div className="grid grid-cols-2 gap-2">
          <a href={telHref(b.customer_phone)} className={buttonClass("outline", "md")}>
            <Phone className="size-4" /> {b.customer_phone}
          </a>
          <a href={whatsappHref("", b.customer_phone)} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "md")}>
            <WhatsAppIcon className="size-4 text-[#25D366]" /> WhatsApp
          </a>
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500">
          <Phone className="size-4" /> {customer.phone(null)}
        </p>
      )}

      <div className="divide-y divide-zinc-100 rounded-2xl bg-zinc-50 px-4 text-[15px]">
        <Row label={t("court")}>{courtName(b.court_slug)}{b.sport ? ` · ${tc(`sports.${b.sport}`)}` : ""}</Row>
        <Row label={t("date")}>{formatDate(new Date(b.start_at), locale)}</Row>
        <Row label={t("time")}>{formatTimeRange(b.start_at, b.end_at, locale)}</Row>
        <Row label={t("total")}>{formatINR(b.total_amount)}</Row>
        {b.extra_amount > 0 && <Row label={t("extra")}>{formatINR(b.extra_amount)}</Row>}
        <Row label={t("paid")}>{formatINR(b.paid_amount)}</Row>
        {active && (
          <Row label={t("remaining")} strong>
            <span className={b.remaining_amount > 0 ? "text-booked-ink" : "text-brand-700"}>{formatINR(b.remaining_amount)}</span>
          </Row>
        )}
        {isOwner && <Row label={t("bookedBy")}>{nameOf(b.booked_by)}</Row>}
      </div>

      {b.notes && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{b.notes}</p>}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-500">{t("payments")}</h3>
        {isLoading ? <Spinner /> : payments && payments.length > 0 ? (
          <ul className="space-y-2">
            {payments.map((p) => <PaymentRow key={p.id} payment={p} showReceiver={isOwner} />)}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">{t("noPayments")}</p>
        )}
      </div>

      {b.status === "completed" && b.completed_by && (
        <p className="text-sm text-zinc-500">
          {t("completedBy", { name: nameOf(b.completed_by), time: b.completed_at ? formatTime(b.completed_at, locale) : "" })}
        </p>
      )}
      {b.status === "cancelled" && (
        <p className="rounded-xl bg-booked-soft p-3 text-sm text-booked-ink">
          {t("cancelledBy", { name: nameOf(b.cancelled_by) })}
          {b.cancel_reason ? ` — ${b.cancel_reason}` : ""}
          {b.advance_action ? ` · ${t(`advance.${b.advance_action}`)}` : ""}
        </p>
      )}

      {active && (
        <div className="space-y-2 pt-2">
          <Button size="xl" block onClick={() => onMode("complete")}>
            <CheckCircle2 className="size-6" /> {t("takePayment")}
          </Button>
          <Button variant="dangerOutline" size="lg" block onClick={() => onMode("cancel")}>
            <XCircle className="size-5" /> {t("cancel")}
          </Button>
        </div>
      )}

      {/* Only owners can change booking details. */}
      {isOwner && b.status !== "cancelled" && (
        <Link href={`/staff/bookings/${b.id}/edit`} className={buttonClass("outline", "lg", "w-full")}>
          <Pencil className="size-5" /> {t("edit")}
        </Link>
      )}
    </div>
  );
}

function PaymentRow({ payment: p, showReceiver }: { payment: Payment; showReceiver: boolean }) {
  const t = useTranslations("staff.booking");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const nameOf = useNameOf();
  const [opening, setOpening] = useState(false);

  const openProof = async () => {
    if (!p.screenshot_path) return;
    setOpening(true);
    const url = await proofUrl(p.screenshot_path);
    setOpening(false);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <li className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2.5 text-sm">
      <div>
        <p className="font-semibold">
          {t(`kind.${p.kind}`)} · {tc(`methods.${p.method}`)}
        </p>
        <p className="text-zinc-500">
          {formatDate(new Date(p.created_at), locale, { day: "numeric", month: "short" })}, {formatTime(p.created_at, locale)}
          {showReceiver && ` · ${t("receivedBy", { name: nameOf(p.received_by) })}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {p.screenshot_path && showReceiver && (
          <button onClick={openProof} aria-label={t("viewProof")} className="rounded-lg p-1.5 text-sky-700 hover:bg-sky-50">
            {opening ? <Spinner className="size-4" /> : <ImageIcon className="size-5" />}
          </button>
        )}
        <span className={cn("font-bold", p.kind === "refund" && "text-booked-ink")}>
          {p.kind === "refund" ? "−" : ""}{formatINR(p.amount)}
        </span>
      </div>
    </li>
  );
}

function CompleteForm({ booking: b, onBack, onDone }: { booking: BookingSummary; onBack: () => void; onDone: () => void }) {
  const customer = useCustomerLabels();
  const t = useTranslations("staff.complete");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const toast = useToast();
  const qc = useQueryClient();
  const [upi, setUpi] = useState("");
  const [cash, setCash] = useState("");
  const [extra, setExtra] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmShort, setConfirmShort] = useState(false);
  const [pending, start] = useTransition();

  const extraAmt = parseAmount(extra);
  const due = Math.max(b.remaining_amount, 0) + extraAmt;
  const got = parseAmount(upi) + parseAmount(cash);
  const short = due - got;

  const addExtra = (price: number) => setExtra(String(extraAmt + price));
  const fillAll = (method: "upi" | "cash") => {
    if (method === "upi") { setUpi(String(due)); setCash(""); } else { setCash(String(due)); setUpi(""); }
  };

  const submit = () => {
    if (short > 0 && !confirmShort) {
      setConfirmShort(true);
      return;
    }
    start(async () => {
      let screenshotPath: string | null = null;
      if (file && parseAmount(upi) > 0) {
        try {
          screenshotPath = await uploadPaymentProof(file, b.id);
        } catch {
          toast(te("uploadFailed"), "error");
          return;
        }
      }
      const res = await completeBookingAction({
        bookingId: b.id,
        upi: parseAmount(upi),
        cash: parseAmount(cash),
        extra: extraAmt,
        screenshotPath,
      });
      if (!res.ok) {
        toast(te(res.error), "error");
        return;
      }
      qc.invalidateQueries({ queryKey: qk.bookings });
      qc.invalidateQueries({ queryKey: qk.payments });
      toast(t("success"));
      onDone();
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-zinc-50 p-4">
        <p className="font-semibold">{customer.name(b.customer_name)}</p>
        <div className="mt-2 flex justify-between text-[15px]"><span className="text-zinc-500">{t("remaining")}</span><span className="font-bold">{formatINR(b.remaining_amount)}</span></div>
      </div>

      <Field label={t("extra")} htmlFor="extra" hint={t("extraHint")}>
        <div className="mb-2 flex flex-wrap gap-2">
          {businessConfig.extraItems.map((item) => (
            <button key={item.key} type="button" onClick={() => addExtra(item.price)}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold">
              <Plus className="size-4" /> {tc(`extras.${item.key}`)} {formatINR(item.price)}
            </button>
          ))}
          {extraAmt > 0 && (
            <button type="button" onClick={() => setExtra("")} className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-sm text-zinc-500">
              <X className="size-4" /> {tc("clear")}
            </button>
          )}
        </div>
        <Input id="extra" inputMode="numeric" placeholder="0" value={extra} onChange={(e) => setExtra(e.target.value)} />
      </Field>

      <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-4 text-center">
        <p className="text-sm text-brand-800">{t("collectNow")}</p>
        <p className="text-3xl font-extrabold tracking-tight text-ink">{formatINR(due)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => fillAll("upi")}>{t("allUpi")}</Button>
          <Button variant="outline" size="sm" onClick={() => fillAll("cash")}>{t("allCash")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("upi")} htmlFor="upi">
          <Input id="upi" inputMode="numeric" placeholder="0" value={upi} onChange={(e) => { setUpi(e.target.value); setConfirmShort(false); }} />
        </Field>
        <Field label={t("cash")} htmlFor="cash">
          <Input id="cash" inputMode="numeric" placeholder="0" value={cash} onChange={(e) => { setCash(e.target.value); setConfirmShort(false); }} />
        </Field>
      </div>

      {parseAmount(upi) > 0 && (
        <Field label={t("screenshot")} hint={t("screenshotHint")}>
          <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3",
            file ? "border-brand-400 bg-brand-50" : "border-zinc-300")}>
            <Camera className="size-6 text-zinc-500" />
            <span className="flex-1 truncate text-sm">{file ? file.name : t("chooseScreenshot")}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
      )}

      {got > 0 && short !== 0 && (
        <p className={cn("rounded-xl p-3 text-sm font-medium", short > 0 ? "bg-amber-50 text-amber-900" : "bg-sky-50 text-sky-900")}>
          {short > 0 ? t("short", { amount: formatINR(short) }) : t("over", { amount: formatINR(-short) })}
        </p>
      )}
      {confirmShort && short > 0 && (
        <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-900">{t("confirmShort", { amount: formatINR(short) })}</p>
      )}

      <div className="space-y-2">
        <Button size="xl" block loading={pending} onClick={submit}>
          <CheckCircle2 className="size-6" /> {confirmShort && short > 0 ? t("completeAnyway") : t("submit")}
        </Button>
        <Button variant="ghost" block onClick={onBack} disabled={pending}>{tc("back")}</Button>
      </div>
    </div>
  );
}

function CancelForm({ booking: b, onBack, onDone }: { booking: BookingSummary; onBack: () => void; onDone: () => void }) {
  const customer = useCustomerLabels();
  const t = useTranslations("staff.cancel");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const toast = useToast();
  const qc = useQueryClient();
  const reasons = ["noShow", "customerCancelled", "weather", "other"] as const;
  const [reason, setReason] = useState<(typeof reasons)[number]>("noShow");
  const [other, setOther] = useState("");
  const [action, setAction] = useState<"kept" | "refunded">("kept");
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await cancelBookingAction({
        bookingId: b.id,
        advanceAction: action,
        reason: reason === "other" ? other : t(`reasons.${reason}`),
      });
      if (!res.ok) {
        toast(te(res.error), "error");
        return;
      }
      qc.invalidateQueries({ queryKey: qk.bookings });
      qc.invalidateQueries({ queryKey: qk.payments });
      toast(t("success"));
      onDone();
    });

  return (
    <div className="space-y-5">
      <p className="text-zinc-700">{t("question", { name: customer.name(b.customer_name) })}</p>
      <Field label={t("reason")}>
        <Chips size="sm" name={t("reason")} value={reason} onChange={setReason}
          options={reasons.map((r) => ({ value: r, label: t(`reasons.${r}`) }))} />
      </Field>
      {reason === "other" && <Input aria-label={t("reason")} value={other} onChange={(e) => setOther(e.target.value)} />}

      {b.paid_amount > 0 && (
        <Field label={t("advanceQuestion", { amount: formatINR(b.paid_amount) })}>
          <div className="grid grid-cols-2 gap-2">
            {(["kept", "refunded"] as const).map((a) => (
              <button key={a} type="button" onClick={() => setAction(a)} aria-pressed={action === a}
                className={cn("rounded-xl border-2 p-3 text-left", action === a ? "border-ink bg-soft" : "border-line")}>
                <p className="font-semibold">{t(`${a}.title`)}</p>
                <p className="text-xs text-zinc-500">{t(`${a}.desc`)}</p>
              </button>
            ))}
          </div>
        </Field>
      )}

      <div className="space-y-2">
        <Button variant="danger" size="xl" block loading={pending} onClick={submit}>
          <XCircle className="size-6" /> {t("submit")}
        </Button>
        <Button variant="ghost" block onClick={onBack} disabled={pending}>{tc("back")}</Button>
      </div>
    </div>
  );
}
