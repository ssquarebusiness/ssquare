import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Digits only, last 10 — "+91 98765 43210" → "9876543210". */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

export function telHref(phone: string, countryCode = "91") {
  return `tel:+${countryCode}${normalizePhone(phone)}`;
}

/** WhatsApp deep link. Without a phone, WhatsApp lets the user pick a contact. */
export function whatsappHref(text: string, phone?: string, countryCode = "91") {
  const to = phone ? `${countryCode}${normalizePhone(phone)}` : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

/** Username → internal auth email (Supabase Auth needs an email). */
export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@staff.ssquare.local`;
}
