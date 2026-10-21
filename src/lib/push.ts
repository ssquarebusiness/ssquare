import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

type Message = { title: string; body: string; url?: string; tag?: string };

let configured = false;
function configure() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT?.trim() || "mailto:admin@example.com", pub, priv);
  configured = true;
  return true;
}

/**
 * Saves an in-app notification for each recipient and sends a web-push to every
 * device they enabled. Dead subscriptions (uninstalled app, revoked permission) are removed.
 */
export async function notifyProfiles(profileIds: string[], msg: Message) {
  if (profileIds.length === 0) return;
  const admin = createAdminClient();

  await admin.from("notifications").insert(
    profileIds.map((profile_id) => ({ profile_id, title: msg.title, body: msg.body, url: msg.url ?? null })),
  );

  if (!configure()) return;
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("profile_id", profileIds);

  const payload = JSON.stringify({ ...msg, url: msg.url ?? "/staff" });
  const dead: string[] = [];
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24, urgency: "high" },
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(s.id);
      }
    }),
  );
  if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);
}

/** Notify all active owners, optionally skipping the person who did the action. */
export async function notifyOwners(msg: Message, exceptProfileId?: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("role", "owner").eq("is_active", true);
  const ids = (data ?? []).map((p) => p.id).filter((id) => id !== exceptProfileId);
  await notifyProfiles(ids, msg);
}
