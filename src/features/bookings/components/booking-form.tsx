"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw, UserCheck } from "lucide-react";
import { businessConfig, COURT_SPORTS, type CourtSlug, type PaymentMethod } from "@/config/business";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCourtOptions, useProfiles, useRates } from "@/features/common/queries";
import { useStaff } from "@/features/staff/context";
import { formatINR, parseAmount } from "@/lib/money";
import { computeTotal, rateAt } from "@/lib/pricing";
import { qk } from "@/lib/query-keys";
import { overlaps } from "@/lib/slots";
import { atIST, formatMinutes, istDateStr, istMinutesOfDay, type DateStr } from "@/lib/time";
import type { Booking } from "@/lib/types";
import { normalizePhone } from "@/lib/utils";
import { durationLabel } from "@/lib/i18n-helpers";
import { createBookingAction } from "../actions";
import { findCustomerByPhone, useBusyTimes } from "../queries";
import { createBookingSchema } from "../schema";
import { BookingConfirmation } from "./booking-confirmation";
import { DayStrip } from "./day-strip";

const STEP = businessConfig.slotStepMinutes;
const CUSTOM = -1;

/** Next start time on the booking step after now (for today), else 6 PM. */
function defaultStart(date: DateStr) {
  if (date !== istDateStr()) return 18 * 60;
  return Math.min(Math.ceil((istMinutesOfDay(new Date()) + 1) / STEP) * STEP, 1440 - STEP);
}

export function BookingForm({ initialDate, initialCourt }: { initialDate: DateStr; initialCourt?: CourtSlug }) {
  const t = useTranslations("staff.bookingForm");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const me = useStaff();
  const toast = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: rates } = useRates();
  const { data: profiles } = useProfiles();
  const courtOptions = useCourtOptions();

  const owners = (profiles ?? []).filter((p) => p.role === "owner" && p.is_active);
  const activeStaff = (profiles ?? []).filter((p) => p.is_active);

  const [court, setCourt] = useState<CourtSlug>(initialCourt ?? "turf");
  // First sport of the court is pre-selected (turf → cricket, pickleball → pickleball) so a price shows at once.
  const [sport, setSport] = useState<string>(COURT_SPORTS[initialCourt ?? "turf"][0]);
  const [date, setDate] = useState<DateStr>(initialDate);
  const [startMin, setStartMin] = useState(() => defaultStart(initialDate));
  const [preset, setPreset] = useState<number>(60);
  const [customMin, setCustomMin] = useState(150);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [totalInput, setTotalInput] = useState<string | null>(null); // null = use auto price
  const [advance, setAdvance] = useState("0");
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>("upi");
  const [advanceBy, setAdvanceBy] = useState(me.id);
  const [bookedBy, setBookedBy] = useState<string | null>(me.role === "owner" ? me.id : null);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [repeat, setRepeat] = useState(false);
  const [created, setCreated] = useState<Booking | null>(null);
  const [pending, startTransition] = useTransition();

  const effectiveBookedBy = bookedBy ?? owners[0]?.id ?? me.id;
  const duration = preset === CUSTOM ? customMin : preset;
  const start = atIST(date, startMin);
  const end = new Date(start.getTime() + duration * 60_000);

  const autoTotal = useMemo(
    () => (rates ? computeTotal(rates, sport, start, end) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rates, sport, start.getTime(), end.getTime()],
  );
  const hourlyRate = rates ? rateAt(rates, sport, start) : null;

  // A typed total is a one-off change: picking a new sport, date or time brings back the rate price.
  useEffect(() => setTotalInput(null), [sport, date, startMin, duration]);
  const total = totalInput == null ? autoTotal ?? 0 : parseAmount(totalInput);
  const advanceAmount = parseAmount(advance);

  // Conflicts: today's day + the next day (late bookings can cross midnight).
  const busyToday = useBusyTimes(date);
  const nextDay = istDateStr(new Date(atIST(date, 1440).getTime()));
  const busyNext = useBusyTimes(nextDay);
  const busy = [...(busyToday.data ?? []), ...(busyNext.data ?? [])].filter((b) => b.court_slug === court);
  const clash = overlaps(start, end, busy.map((b) => ({ start: b.start_at, end: b.end_at })));

  // Repeat customer: fill the name from their last booking.
  useEffect(() => {
    const p = normalizePhone(phone);
    if (p.length !== 10 || name) return;
    let cancelled = false;
    findCustomerByPhone(p).then((c) => {
      if (cancelled || !c?.customer_name) return;
      setName(c.customer_name);
      if (c.customer_email) setEmail(c.customer_email);
      setRepeat(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const startOptions = useMemo(
    () => Array.from({ length: 1440 / STEP }, (_, i) => i * STEP).map((m) => ({ value: m, label: formatMinutes(m, locale) })),
    [locale],
  );
  const customOptions = useMemo(
    () => Array.from({ length: businessConfig.maxBookingMinutes / STEP }, (_, i) => (i + 1) * STEP),
    [],
  );

  const submit = () => {
    const input = {
      court,
      sport,
      name,
      phone: normalizePhone(phone),
      email: email.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      total,
      bookedBy: effectiveBookedBy,
      advance: advanceAmount,
      advanceMethod,
      advanceReceivedBy: advanceBy,
      notes: notes.trim() || undefined,
    };
    const parsed = createBookingSchema.safeParse(input);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= issue.message;
      setErrors(errs);
      toast(te("checkForm"), "error");
      return;
    }
    if (clash) {
      toast(te("slotTaken"), "error");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await createBookingAction(parsed.data);
      if (!res.ok) {
        toast(te(res.error), "error");
        return;
      }
      qc.invalidateQueries({ queryKey: qk.bookings });
      qc.invalidateQueries({ queryKey: qk.payments });
      setCreated(res.data);
    });
  };

  const fieldError = (key: string) => (errors[key] ? t(`errors.${key}`) : undefined);

  return (
    <div className="space-y-6">
      {/* Court & sport */}
      <section className="space-y-3">
        <Field label={t("court")}>
          <Chips
            name={t("court")}
            value={court}
            onChange={(v) => { setCourt(v); setSport(COURT_SPORTS[v][0]); }}
            options={courtOptions}
          />
        </Field>
        {COURT_SPORTS[court].length > 1 && (
          <Field label={t("sport")}>
            <Chips
              name={t("sport")}
              size="sm"
              value={sport}
              onChange={setSport}
              options={COURT_SPORTS[court].map((s) => ({ value: s, label: tc(`sports.${s}`) }))}
            />
          </Field>
        )}
      </section>

      {/* Date & time */}
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <Field label={t("date")} htmlFor="date">
          <Input id="date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-3">
          <Field label={t("startTime")} htmlFor="start">
            <Select id="start" value={startMin} onChange={(e) => setStartMin(Number(e.target.value))}>
              {startOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field label={t("duration")}>
            <Chips
              name={t("duration")}
              size="sm"
              value={preset}
              onChange={setPreset}
              options={[
                ...businessConfig.durationPresets.map((m) => ({ value: m, label: durationLabel(tc, m) })),
                { value: CUSTOM, label: t("custom") },
              ]}
            />
          </Field>
          {preset === CUSTOM && (
            <Field label={t("customDuration")} htmlFor="custom">
              <Select id="custom" value={customMin} onChange={(e) => setCustomMin(Number(e.target.value))}>
                {customOptions.map((m) => (
                  <option key={m} value={m}>{durationLabel(tc, m)}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        <DayStrip date={date} court={court} busy={busy} selection={{ start, end }} clash={clash} />
        <p className={clash ? "text-sm font-semibold text-rose-600" : "text-sm text-zinc-600"}>
          {clash ? t("clash") : t("selected", { from: formatMinutes(startMin, locale), to: formatMinutes((startMin + duration) % 1440, locale) })}
        </p>
      </section>

      {/* Customer */}
      <section className="space-y-3">
        <Field label={t("phone")} htmlFor="phone" error={fieldError("phone")}>
          <Input id="phone" type="tel" inputMode="numeric" autoComplete="tel" maxLength={14} placeholder="98765 43210"
            value={phone} onChange={(e) => { setPhone(e.target.value); setRepeat(false); }} aria-invalid={!!errors.phone} />
        </Field>
        <Field label={t("name")} htmlFor="name" error={fieldError("name")}
          hint={repeat ? <span className="inline-flex items-center gap-1 text-brand-700"><UserCheck className="size-4" />{t("repeatCustomer")}</span> : undefined}>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        </Field>
        <Field label={t("email")} htmlFor="email" error={fieldError("email")}>
          <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </section>

      {/* Money */}
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
        <Field
          label={t("total")}
          htmlFor="total"
          error={fieldError("total")}
          hint={
            autoTotal == null ? t("noRate") : totalInput != null ? (
              <button type="button" onClick={() => setTotalInput(null)} className="inline-flex items-center gap-1 font-medium text-brand-700">
                <RotateCcw className="size-3.5" /> {t("useAuto", { amount: formatINR(autoTotal) })}
              </button>
            ) : t("autoHint", { rate: formatINR(hourlyRate ?? 0) })
          }
        >
          <Input id="total" inputMode="numeric" placeholder="0" value={totalInput ?? String(autoTotal ?? "")}
            onChange={(e) => setTotalInput(e.target.value)} />
        </Field>
        <Field label={t("advance")} htmlFor="advance" error={fieldError("advance")}>
          <Input id="advance" inputMode="numeric" placeholder="0" value={advance} onChange={(e) => setAdvance(e.target.value)}
            onFocus={(e) => e.target.select()} />
        </Field>
        {advanceAmount > 0 && (
          <>
            <Field label={t("advanceMethod")}>
              <Chips name={t("advanceMethod")} size="sm" value={advanceMethod} onChange={setAdvanceMethod}
                options={businessConfig.paymentMethods.map((m) => ({ value: m, label: tc(`methods.${m}`) }))} />
            </Field>
            <Field label={t("advanceReceivedBy")} htmlFor="advanceBy">
              <Select id="advanceBy" value={advanceBy} onChange={(e) => setAdvanceBy(e.target.value)}>
                {activeStaff.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
              </Select>
            </Field>
          </>
        )}
        <div className="flex justify-between rounded-xl bg-zinc-50 px-3 py-2.5 text-[15px]">
          <span className="text-zinc-600">{t("remaining")}</span>
          <span className="font-bold">{formatINR(Math.max(total - advanceAmount, 0))}</span>
        </div>
      </section>

      <section className="space-y-3">
        <Field label={t("bookedBy")}>
          <Chips name={t("bookedBy")} value={effectiveBookedBy} onChange={setBookedBy}
            options={owners.map((o) => ({ value: o.id, label: o.display_name }))} />
        </Field>
        <Field label={t("notes")} htmlFor="notes">
          <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </section>

      <Button size="xl" block loading={pending} disabled={clash} onClick={submit}>
        {t("save")}
      </Button>

      {created && (
        <BookingConfirmation
          booking={created}
          advance={advanceAmount}
          onClose={() => router.push("/staff")}
        />
      )}
    </div>
  );
}
