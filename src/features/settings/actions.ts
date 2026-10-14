"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { COURTS } from "@/config/business";
import { DEFAULT_CARETAKER_PERMISSIONS, PERMISSIONS } from "@/config/permissions";
import { staffFor } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { usernameToEmail } from "@/lib/utils";

const BAN_FOREVER = "876000h"; // ~100 years

const newStaffSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  displayName: z.string().trim().min(1).max(60),
  password: z.string().min(8).max(72),
});

/** Owner adds a caretaker account. */
export async function createStaffAction(input: z.infer<typeof newStaffSchema>): Promise<ActionResult> {
  if (!(await staffFor("owner"))) return { ok: false, error: "forbidden" };
  const parsed = newStaffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidData" };
  const v = parsed.data;
  const admin = createAdminClient();

  const { data: taken } = await admin.from("profiles").select("id").eq("username", v.username).maybeSingle();
  if (taken) return { ok: false, error: "usernameTaken" };

  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(v.username),
    password: v.password,
    email_confirm: true,
  });
  if (error || !data.user) return { ok: false, error: /already/i.test(error?.message ?? "") ? "usernameTaken" : "generic" };

  const { error: pErr } = await admin.from("profiles").insert({
    id: data.user.id,
    username: v.username,
    display_name: v.displayName,
    role: "caretaker",
    permissions: DEFAULT_CARETAKER_PERMISSIONS,
  });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: "generic" };
  }
  return { ok: true, data: undefined };
}

export async function updatePermissionsAction(profileId: string, permissions: string[]): Promise<ActionResult> {
  if (!(await staffFor("owner"))) return { ok: false, error: "forbidden" };
  const clean = permissions.filter((p): p is (typeof PERMISSIONS)[number] => (PERMISSIONS as readonly string[]).includes(p));
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ permissions: clean }).eq("id", profileId).eq("role", "caretaker");
  return error ? { ok: false, error: "generic" } : { ok: true, data: undefined };
}

/** Deactivate (blocks login, keeps history) or re-activate a staff account. */
export async function setStaffActiveAction(profileId: string, active: boolean): Promise<ActionResult> {
  const actor = await staffFor("owner");
  if (!actor) return { ok: false, error: "forbidden" };
  if (profileId === actor.id) return { ok: false, error: "cannotDeactivateSelf" };
  const admin = createAdminClient();

  if (!active) {
    const { data: target } = await admin.from("profiles").select("role").eq("id", profileId).single();
    if (target?.role === "owner") {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true })
        .eq("role", "owner").eq("is_active", true);
      if ((count ?? 0) <= 1) return { ok: false, error: "lastOwner" };
    }
  }

  const { error: authErr } = await admin.auth.admin.updateUserById(profileId, { ban_duration: active ? "none" : BAN_FOREVER });
  if (authErr) return { ok: false, error: "generic" };
  await admin.from("profiles").update({ is_active: active }).eq("id", profileId);
  if (!active) await admin.from("push_subscriptions").delete().eq("profile_id", profileId);
  return { ok: true, data: undefined };
}

export async function resetStaffPasswordAction(profileId: string, password: string): Promise<ActionResult> {
  if (!(await staffFor("owner"))) return { ok: false, error: "forbidden" };
  if (password.length < 8 || password.length > 72) return { ok: false, error: "passwordShort" };
  const { error } = await createAdminClient().auth.admin.updateUserById(profileId, { password });
  return error ? { ok: false, error: "generic" } : { ok: true, data: undefined };
}

const ruleSchema = z.object({
  day_type: z.enum(["all", "weekday", "weekend"]),
  start_minute: z.number().int().min(0).max(1439),
  end_minute: z.number().int().min(1).max(1440),
  price_per_hour: z.number().int().min(0).max(100_000),
});

/** Replaces all rate rules of a court. New rules are inserted before old ones are removed. */
export async function saveRatesAction(court: string, rules: z.infer<typeof ruleSchema>[]): Promise<ActionResult> {
  if (!(await staffFor("owner"))) return { ok: false, error: "forbidden" };
  if (!(COURTS as readonly string[]).includes(court)) return { ok: false, error: "invalidData" };
  const parsed = z.array(ruleSchema).min(1).max(20).safeParse(rules);
  if (!parsed.success) return { ok: false, error: "invalidData" };

  const supabase = await createClient();
  const { data: old } = await supabase.from("rate_rules").select("id").eq("court_slug", court);
  const { error } = await supabase.from("rate_rules").insert(parsed.data.map((r) => ({ ...r, court_slug: court })));
  if (error) return { ok: false, error: "generic" };
  if (old?.length) await supabase.from("rate_rules").delete().in("id", old.map((r) => r.id));

  revalidatePath("/", "layout"); // public website shows rates
  return { ok: true, data: undefined };
}
