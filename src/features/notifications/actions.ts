"use server";
import { z } from "zod";
import { staffFor } from "@/lib/auth/server";
import { notifyProfiles } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

const subSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function savePushSubscriptionAction(sub: unknown, userAgent: string): Promise<ActionResult> {
  const actor = await staffFor();
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = subSchema.safeParse(sub);
  if (!parsed.success) return { ok: false, error: "invalidData" };

  const supabase = await createClient();
  // Same device re-subscribing (or switching accounts) → replace the old row.
  await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    profile_id: actor.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    user_agent: userAgent.slice(0, 300),
  });
  return error ? { ok: false, error: "generic" } : { ok: true, data: undefined };
}

export async function deletePushSubscriptionAction(endpoint: string): Promise<ActionResult> {
  const actor = await staffFor();
  if (!actor) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: true, data: undefined };
}

export async function sendTestPushAction(): Promise<ActionResult> {
  const actor = await staffFor();
  if (!actor) return { ok: false, error: "forbidden" };
  await notifyProfiles([actor.id], {
    title: "SSquare 🔔",
    body: `Notifications are working, ${actor.display_name}!`,
    url: "/staff/notifications",
  });
  return { ok: true, data: undefined };
}

export async function markAllReadAction(): Promise<ActionResult> {
  const actor = await staffFor();
  if (!actor) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).eq("profile_id", actor.id);
  return { ok: true, data: undefined };
}
