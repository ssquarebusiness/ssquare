"use client";
import { createContext, useContext } from "react";
import type { Permission } from "@/config/permissions";
import { can as canDo } from "@/lib/auth/permissions";
import type { Profile } from "@/lib/types";

const StaffContext = createContext<Profile | null>(null);

export function StaffProvider({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return <StaffContext.Provider value={profile}>{children}</StaffContext.Provider>;
}

export function useStaff(): Profile {
  const p = useContext(StaffContext);
  if (!p) throw new Error("useStaff must be used inside StaffProvider");
  return p;
}

export function useCan() {
  const profile = useStaff();
  return (perm: Permission) => canDo(profile, perm);
}

export function useIsOwner() {
  return useStaff().role === "owner";
}
