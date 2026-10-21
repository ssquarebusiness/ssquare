/**
 * Text templates for WhatsApp / copy messages. Edit freely — placeholders are filled in code.
 */
import type { Locale } from "@/i18n/routing";

export type BookingMessageData = {
  code: string;
  name: string;
  phone: string;
  date: string; // already formatted
  time: string; // already formatted, e.g. "7:00 PM – 8:30 PM"
  court: string; // already translated
  sport?: string;
  total: string;
  advance: string;
  remaining: string;
  bookedBy: string;
  mapUrl: string;
};

const bookingTemplates: Record<Locale, (d: BookingMessageData) => string> = {
  en: (d) =>
    [
      `*SSquare – Booking Confirmed* `,
      ``,
      `Booking ID: ${d.code}`,
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      `Date: ${d.date}`,
      `Time: ${d.time}`,
      `Court: ${d.court}${d.sport ? ` (${d.sport})` : ""}`,
      `Total Amount: ${d.total}`,
      `Advance Paid: ${d.advance}`,
      `Remaining: ${d.remaining}`,
      `Booked By: ${d.bookedBy}`,
      ``,
      `Location: ${d.mapUrl}`,
      `Thank you! See you at SSquare `,
    ].join("\n"),
  gu: (d) =>
    [
      `*SSquare – બુકિંગ કન્ફર્મ*`,
      ``,
      `બુકિંગ ID: ${d.code}`,
      `નામ: ${d.name}`,
      `ફોન: ${d.phone}`,
      `તારીખ: ${d.date}`,
      `સમય: ${d.time}`,
      `કોર્ટ: ${d.court}${d.sport ? ` (${d.sport})` : ""}`,
      `કુલ રકમ: ${d.total}`,
      `એડવાન્સ ભર્યા: ${d.advance}`,
      `બાકી: ${d.remaining}`,
      `બુક કરનાર: ${d.bookedBy}`,
      ``,
      `લોકેશન: ${d.mapUrl}`,
      `આભાર! SSquare પર મળીએ`,
    ].join("\n"),
  hi: (d) =>
    [
      `*SSquare – बुकिंग कन्फर्म* `,
      ``,
      `बुकिंग ID: ${d.code}`,
      `नाम: ${d.name}`,
      `फ़ोन: ${d.phone}`,
      `तारीख: ${d.date}`,
      `समय: ${d.time}`,
      `कोर्ट: ${d.court}${d.sport ? ` (${d.sport})` : ""}`,
      `कुल राशि: ${d.total}`,
      `एडवांस दिया: ${d.advance}`,
      `बाकी: ${d.remaining}`,
      `बुक करने वाले: ${d.bookedBy}`,
      ``,
      `लोकेशन: ${d.mapUrl}`,
      `धन्यवाद! SSquare पर मिलते हैं 🙏`,
    ].join("\n"),
};

/** Shown in messages when the customer's name / phone was not given. */
export const unknownCustomerText: Record<Locale, { name: string; phone: string }> = {
  en: { name: "Unknown customer", phone: "Not given" },
  gu: { name: "અજાણ્યા ગ્રાહક", phone: "આપેલ નથી" },
  hi: { name: "अज्ञात ग्राहक", phone: "नहीं दिया" },
};

export function bookingMessage(locale: Locale, data: BookingMessageData) {
  return bookingTemplates[locale](data);
}

/** Message a visitor sends from the public availability page. */
const enquiryTemplates: Record<Locale, (court: string, date: string, time: string) => string> = {
  en: (court, date, time) =>
    `Hello SSquare \nI would like to book the ${court} on ${date} from ${time}.\nPlease confirm if it is available.`,
  gu: (court, date, time) =>
    `નમસ્તે SSquare \nમારે ${date} ના રોજ ${time} થી ${court} બુક કરવું છે.\nકૃપા કરીને ઉપલબ્ધ છે કે નહીં તે જણાવશો.`,
  hi: (court, date, time) =>
    `नमस्ते SSquare \nमुझे ${date} को ${time} से ${court} बुक करना है।\nकृपया बताएं कि उपलब्ध है या नहीं।`,
};

export function enquiryMessage(locale: Locale, court: string, date: string, time: string) {
  return enquiryTemplates[locale](court, date, time);
}

/** Push notification text sent to owners. */
export const pushTemplates = {
  completed: (by: string, name: string, upi: string, cash: string) => ({
    title: `${by} completed a booking`,
    body: `${name} · UPI ${upi} · Cash ${cash}`,
  }),
  cancelled: (by: string, name: string, time: string) => ({
    title: `${by} cancelled a booking`,
    body: `${name} · ${time}`,
  }),
  created: (by: string, name: string, time: string) => ({
    title: `New booking by ${by}`,
    body: `${name} · ${time}`,
  }),
};
