"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { Check, Copy, Send } from "lucide-react";
import { bookingMessage } from "@/config/messages";
import { siteConfig } from "@/config/site";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { Button, buttonClass } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useCourts, useNameOf } from "@/features/common/queries";
import { formatINR } from "@/lib/money";
import { formatDate, formatTimeRange } from "@/lib/time";
import type { Booking } from "@/lib/types";
import { whatsappHref } from "@/lib/utils";

/** Popup shown after saving a booking: full details + Copy + WhatsApp share. */
export function BookingConfirmation({ booking, advance, onClose }: { booking: Booking; advance: number; onClose: () => void }) {
  const t = useTranslations("staff.confirmation");
  const uiLocale = useLocale() as Locale;
  const toast = useToast();
  const nameOf = useNameOf();
  const { data: courts } = useCourts();
  const [msgLocale, setMsgLocale] = useState<Locale>(uiLocale);
  const [copied, setCopied] = useState(false);

  const court = courts?.find((c) => c.slug === booking.court_slug);
  const tSports = useTranslations("common.sports");
  const message = bookingMessage(msgLocale, {
    code: booking.code,
    name: booking.customer_name,
    phone: booking.customer_phone,
    date: formatDate(new Date(booking.start_at), msgLocale),
    time: formatTimeRange(booking.start_at, booking.end_at, msgLocale),
    court: court?.name_i18n[msgLocale] ?? booking.court_slug,
    sport: booking.sport ? tSports(booking.sport) : undefined,
    total: formatINR(booking.total_amount),
    advance: formatINR(advance),
    remaining: formatINR(booking.total_amount - advance),
    bookedBy: nameOf(booking.booked_by),
    mapUrl: siteConfig.maps.directionsUrl,
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Older iOS: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    toast(t("copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={<span className="flex items-center gap-2 text-brand-800"><Check className="size-6 rounded-full bg-brand-100 p-1" /> {t("title")}</span>}
      footer={
        <div className="space-y-2 pb-1">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="lg" onClick={copy}>
              {copied ? <Check className="size-5" /> : <Copy className="size-5" />} {t("copy")}
            </Button>
            <a href={whatsappHref(message, booking.customer_phone)} target="_blank" rel="noopener noreferrer"
              className={buttonClass("whatsapp", "lg")}>
              <WhatsAppIcon /> {t("whatsapp")}
            </a>
          </div>
          <div className="flex items-center justify-between text-sm">
            <a href={whatsappHref(message)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700">
              <Send className="size-4" /> {t("otherContact")}
            </a>
            <Link href="/staff" className="font-semibold text-zinc-600" onClick={onClose}>{t("done")}</Link>
          </div>
        </div>
      }
    >
      <Chips size="sm" name={t("language")} value={msgLocale} onChange={setMsgLocale}
        options={locales.map((l) => ({ value: l, label: localeNames[l] }))} className="mb-3" />
      <pre className="rounded-2xl bg-[#e7ffdb] p-4 font-sans text-[15px] leading-relaxed whitespace-pre-wrap text-zinc-900">{message}</pre>
    </Sheet>
  );
}

export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.9 9.88m8.41-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" />
    </svg>
  );
}
