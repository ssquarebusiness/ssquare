"use server";
import { businessConfig } from "@/config/business";
import { pushTemplates } from "@/config/messages";
import { staffFor } from "@/lib/auth/server";
import { errorKey } from "@/lib/errors";
import { formatINR } from "@/lib/money";
import { notifyOwners } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTimeRange } from "@/lib/time";
import type { ActionResult, Booking, Profile } from "@/lib/types";
import {
  cancelBookingSchema,
  completeBookingSchema,
  createBookingSchema,
  type CancelBookingInput,
  type CompleteBookingInput,
  type CreateBookingInput,
} from "./schema";

function shouldNotify(actor: Profile) {
  return businessConfig.notifyOwnersOn === "everyone" || actor.role !== "owner";
}

function when(b: Pick<Booking, "start_at" | "end_at">) {
  return `${formatDate(new Date(b.start_at), "en", { day: "numeric", month: "short" })}, ${formatTimeRange(b.start_at, b.end_at)}`;
}

export async function createBookingAction(input: CreateBookingInput): Promise<ActionResult<Booking>> {
  const actor = await staffFor("create_booking");
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidData" };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_court_slug: v.court,
    p_sport: v.sport ?? null,
    p_customer_name: v.name,
    p_customer_phone: v.phone,
    p_customer_email: v.email || null,
    p_start_at: v.startAt,
    p_end_at: v.endAt,
    p_total_amount: v.total,
    p_booked_by: v.bookedBy,
    p_advance_amount: v.advance,
    p_advance_method: v.advance > 0 ? v.advanceMethod : null,
    p_advance_received_by: v.advance > 0 ? v.advanceReceivedBy : null,
    p_notes: v.notes ?? null,
  });
  if (error) return { ok: false, error: errorKey(error) };

  const booking = data as Booking;
  if (shouldNotify(actor)) {
    await notifyOwners(
      { ...pushTemplates.created(actor.display_name, booking.customer_name, when(booking)), url: "/staff", tag: booking.id },
      actor.id,
    ).catch(() => {});
  }
  return { ok: true, data: booking };
}

export async function completeBookingAction(input: CompleteBookingInput): Promise<ActionResult<Booking>> {
  const actor = await staffFor();
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = completeBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidData" };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_booking", {
    p_booking_id: v.bookingId,
    p_upi: v.upi,
    p_cash: v.cash,
    p_extra: v.extra,
    p_screenshot_path: v.screenshotPath ?? null,
  });
  if (error) return { ok: false, error: errorKey(error) };

  const booking = data as Booking;
  if (shouldNotify(actor)) {
    await notifyOwners(
      {
        ...pushTemplates.completed(actor.display_name, booking.customer_name, formatINR(v.upi), formatINR(v.cash)),
        url: "/staff",
        tag: booking.id,
      },
      actor.id,
    ).catch(() => {});
  }
  return { ok: true, data: booking };
}

export async function cancelBookingAction(input: CancelBookingInput): Promise<ActionResult<Booking>> {
  const actor = await staffFor();
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = cancelBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidData" };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_booking_id: v.bookingId,
    p_advance_action: v.advanceAction,
    p_reason: v.reason ?? null,
  });
  if (error) return { ok: false, error: errorKey(error) };

  const booking = data as Booking;
  if (shouldNotify(actor)) {
    await notifyOwners(
      { ...pushTemplates.cancelled(actor.display_name, booking.customer_name, when(booking)), url: "/staff", tag: booking.id },
      actor.id,
    ).catch(() => {});
  }
  return { ok: true, data: booking };
}
