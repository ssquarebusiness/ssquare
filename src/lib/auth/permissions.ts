import type { Permission } from "@/config/permissions";
import type { Profile } from "@/lib/types";

/** Owners can do everything; caretakers only what owners allowed. */
export function can(profile: Pick<Profile, "role" | "permissions"> | null | undefined, perm: Permission) {
  if (!profile) return false;
  return profile.role === "owner" || profile.permissions.includes(perm);
}

export function isOwner(profile: Pick<Profile, "role"> | null | undefined) {
  return profile?.role === "owner";
}
