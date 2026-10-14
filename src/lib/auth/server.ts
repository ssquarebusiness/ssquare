import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Permission } from "@/config/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { can } from "./permissions";

/** Logged-in staff profile for this request (cached per request). */
export const getStaff = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, role, permissions, locale, is_active")
    .eq("id", userId)
    .maybeSingle<Profile>();
  return data && data.is_active ? data : null;
});

/** Use at the top of staff pages / actions. Redirects when not allowed. */
export async function requireStaff(need?: Permission | "owner"): Promise<Profile> {
  const profile = await getStaff();
  // Logged in (middleware checked) but no active profile → account was turned off: end the session.
  if (!profile) redirect("/staff/signout?reason=inactive");
  if (need === "owner" ? profile.role !== "owner" : need && !can(profile, need)) redirect("/staff");
  return profile;
}

/** Same check for server actions — returns null instead of redirecting. */
export async function staffFor(need?: Permission | "owner"): Promise<Profile | null> {
  const profile = await getStaff();
  if (!profile) return null;
  if (need === "owner" ? profile.role !== "owner" : need && !can(profile, need)) return null;
  return profile;
}
