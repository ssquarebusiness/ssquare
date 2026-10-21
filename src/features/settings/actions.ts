"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SPORTS } from "@/config/business";
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

const sportRatesSchema = z
  .array(
    z.object({
      sport: z.enum(SPORTS),
      weekday_price: z.number().int().min(0).max(100_000),
      weekend_price: z.number().int().min(0).max(100_000),
    }),
  )
  .min(1)
  .max(SPORTS.length);

/** Owners set the weekday / weekend price per hour of each sport. */
export async function saveSportRatesAction(rates: z.infer<typeof sportRatesSchema>): Promise<ActionResult> {
  if (!(await staffFor("owner"))) return { ok: false, error: "forbidden" };
  const parsed = sportRatesSchema.safeParse(rates);
  if (!parsed.success) return { ok: false, error: "invalidData" };

  const supabase = await createClient();
  for (const r of parsed.data) {
    const { error } = await supabase
      .from("sport_rates")
      .update({ weekday_price: r.weekday_price, weekend_price: r.weekend_price })
      .eq("sport", r.sport);
    if (error) {
      console.error("saveSportRatesAction", error);
      return { ok: false, error: "generic" };
    }
  }

  revalidatePath("/", "layout"); // the public website shows these prices
  return { ok: true, data: undefined };
}
