import { NextResponse, type NextRequest } from "next/server";
import { businessConfig } from "@/config/business";
import { PROOF_BUCKET } from "@/features/bookings/upload-constants";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Runs once a day (vercel.json → crons):
 *  1. Touches the database so the Supabase free project is never paused for inactivity.
 *  2. Deletes UPI screenshots older than `screenshotRetentionDays` to keep storage under the free 1 GB.
 * Protected by CRON_SECRET (Vercel sends it automatically as a Bearer token).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { count: bookings } = await admin.from("bookings").select("id", { count: "exact", head: true });

  const cutoff = new Date(Date.now() - businessConfig.screenshotRetentionDays * 864e5).toISOString();
  const { data: old } = await admin
    .from("payments")
    .select("id, screenshot_path")
    .not("screenshot_path", "is", null)
    .lt("created_at", cutoff)
    .limit(500);

  let removed = 0;
  if (old?.length) {
    const paths = old.map((p) => p.screenshot_path as string);
    const { error } = await admin.storage.from(PROOF_BUCKET).remove(paths);
    if (!error) {
      await admin.from("payments").update({ screenshot_path: null }).in("id", old.map((p) => p.id));
      removed = paths.length;
    }
  }

  return NextResponse.json({ ok: true, bookings, screenshotsRemoved: removed });
}
