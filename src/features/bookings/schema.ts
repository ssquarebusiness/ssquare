import { z } from "zod";
import { businessConfig, COURTS } from "@/config/business";

export const createBookingSchema = z
  .object({
    court: z.enum(COURTS),
    sport: z.string().max(30).optional().nullable(),
    // Customer details are optional; blanks are saved empty and shown as "Unknown".
    name: z.string().trim().max(100).optional(),
    phone: z.union([z.literal(""), z.string().regex(/^[0-9]{10}$/)]).optional(),
    email: z.union([z.literal(""), z.email()]).optional(),
    startAt: z.iso.datetime({ offset: true }),
    endAt: z.iso.datetime({ offset: true }),
    total: z.number().int().min(0).max(1_000_000),
    bookedBy: z.uuid(),
    advance: z.number().int().min(0),
    advanceMethod: z.enum(businessConfig.paymentMethods),
    advanceReceivedBy: z.uuid(),
    notes: z.string().max(500).optional(),
  })
  .refine((v) => new Date(v.endAt) > new Date(v.startAt), { path: ["endAt"], message: "endBeforeStart" })
  .refine(
    (v) => (new Date(v.endAt).getTime() - new Date(v.startAt).getTime()) / 60_000 <= businessConfig.maxBookingMinutes,
    { path: ["endAt"], message: "tooLong" },
  )
  .refine((v) => v.advance <= v.total, { path: ["advance"], message: "advanceTooHigh" });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const completeBookingSchema = z.object({
  bookingId: z.uuid(),
  upi: z.number().int().min(0),
  cash: z.number().int().min(0),
  extra: z.number().int().min(0),
  screenshotPath: z.string().max(300).nullable().optional(),
});
export type CompleteBookingInput = z.infer<typeof completeBookingSchema>;

export const cancelBookingSchema = z.object({
  bookingId: z.uuid(),
  advanceAction: z.enum(["kept", "refunded"]),
  reason: z.string().max(200).optional(),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
