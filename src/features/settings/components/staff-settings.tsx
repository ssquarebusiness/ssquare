"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, Power, UserPlus } from "lucide-react";
import { PERMISSIONS, type Permission } from "@/config/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useProfiles } from "@/features/common/queries";
import { useStaff } from "@/features/staff/context";
import { qk } from "@/lib/query-keys";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createStaffAction, resetStaffPasswordAction, setStaffActiveAction, updatePermissionsAction } from "../actions";

export function StaffSettings() {
  const t = useTranslations("staff.settings");
  const { data: profiles, isLoading } = useProfiles();
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("staffTitle")}</h2>
        <Button size="sm" onClick={() => setAdding(true)}><UserPlus className="size-4" /> {t("addStaff")}</Button>
      </div>
      {isLoading ? <Spinner /> : (
        <ul className="space-y-3">
          {(profiles ?? []).map((p) => <li key={p.id}><StaffCard profile={p} /></li>)}
        </ul>
      )}
      <AddStaffSheet open={adding} onClose={() => setAdding(false)} />
    </section>
  );
}

function StaffCard({ profile: p }: { profile: Profile }) {
  const t = useTranslations("staff.settings");
  const tp = useTranslations("permissions");
  const te = useTranslations("errors");
  const me = useStaff();
  const toast = useToast();
  const qc = useQueryClient();
  const [pending, start] = useTransition();
  const [pwOpen, setPwOpen] = useState(false);
  const [perms, setPerms] = useState<Permission[]>(p.permissions);

  const refresh = () => qc.invalidateQueries({ queryKey: qk.profiles });

  const toggle = (perm: Permission) => {
    const next = perms.includes(perm) ? perms.filter((x) => x !== perm) : [...perms, perm];
    setPerms(next);
    start(async () => {
      const res = await updatePermissionsAction(p.id, next);
      if (!res.ok) { setPerms(perms); return toast(te(res.error), "error"); }
      refresh();
      toast(t("saved"));
    });
  };

  const setActive = (active: boolean) => {
    if (!active && !confirm(t("confirmDeactivate", { name: p.display_name }))) return;
    start(async () => {
      const res = await setStaffActiveAction(p.id, active);
      if (!res.ok) return toast(te(res.error), "error");
      refresh();
      toast(t(active ? "activated" : "deactivated"));
    });
  };

  return (
    <Card className={cn("space-y-3", !p.is_active && "opacity-60")}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold">{p.display_name} {p.id === me.id && <span className="text-sm font-normal text-zinc-500">({t("you")})</span>}</p>
          <p className="text-sm text-zinc-500">@{p.username}</p>
        </div>
        <div className="flex gap-1.5">
          <Badge tone={p.role === "owner" ? "blue" : "gray"}>{t(`roles.${p.role}`)}</Badge>
          {!p.is_active && <Badge tone="red">{t("inactive")}</Badge>}
        </div>
      </div>

      {p.role === "caretaker" && (
        <fieldset className="space-y-1" disabled={!p.is_active}>
          <legend className="mb-1 text-sm font-semibold text-zinc-600">{t("permissionsTitle")}</legend>
          {PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-start gap-3 rounded-xl px-1 py-2">
              <input type="checkbox" checked={perms.includes(perm)} onChange={() => toggle(perm)}
                className="mt-0.5 size-5 shrink-0 accent-brand-700" />
              <span>
                <span className="block font-medium">{tp(`${perm}.label`)}</span>
                <span className="block text-sm text-zinc-500">{tp(`${perm}.desc`)}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPwOpen(true)} disabled={pending}>
          <KeyRound className="size-4" /> {t("resetPassword")}
        </Button>
        {p.id !== me.id && (
          <Button variant={p.is_active ? "dangerOutline" : "secondary"} size="sm" loading={pending} onClick={() => setActive(!p.is_active)}>
            <Power className="size-4" /> {t(p.is_active ? "deactivate" : "activate")}
          </Button>
        )}
      </div>
      <ResetPasswordSheet profile={p} open={pwOpen} onClose={() => setPwOpen(false)} />
    </Card>
  );
}

function ResetPasswordSheet({ profile, open, onClose }: { profile: Profile; open: boolean; onClose: () => void }) {
  const t = useTranslations("staff.settings");
  const te = useTranslations("errors");
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [pending, start] = useTransition();
  return (
    <Sheet open={open} onClose={onClose} title={t("resetPasswordFor", { name: profile.display_name })}>
      <div className="space-y-4">
        <Field label={t("newPassword")} htmlFor={`pw-${profile.id}`} hint={t("passwordHint")}>
          <Input id={`pw-${profile.id}`} type="text" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Button block size="lg" loading={pending} disabled={pw.length < 8}
          onClick={() => start(async () => {
            const res = await resetStaffPasswordAction(profile.id, pw);
            if (!res.ok) return toast(te(res.error), "error");
            toast(t("passwordReset"));
            setPw(""); onClose();
          })}>
          {t("save")}
        </Button>
      </div>
    </Sheet>
  );
}

function AddStaffSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("staff.settings");
  const te = useTranslations("errors");
  const toast = useToast();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const validUser = /^[a-z0-9_]{3,30}$/.test(username.trim().toLowerCase());

  return (
    <Sheet open={open} onClose={onClose} title={t("addStaff")}>
      <div className="space-y-4">
        <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-900">{t("addStaffNote")}</p>
        <Field label={t("displayName")} htmlFor="new-name">
          <Input id="new-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Field label={t("username")} htmlFor="new-user" hint={t("usernameHint")}
          error={username && !validUser ? t("usernameInvalid") : undefined}>
          <Input id="new-user" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())} />
        </Field>
        <Field label={t("password")} htmlFor="new-pw" hint={t("passwordHint")}>
          <Input id="new-pw" type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button block size="lg" loading={pending} disabled={!validUser || !displayName.trim() || password.length < 8}
          onClick={() => start(async () => {
            const res = await createStaffAction({ username, displayName, password });
            if (!res.ok) return toast(te(res.error), "error");
            qc.invalidateQueries({ queryKey: qk.profiles });
            toast(t("staffAdded"));
            setUsername(""); setDisplayName(""); setPassword(""); onClose();
          })}>
          {t("create")}
        </Button>
      </div>
    </Sheet>
  );
}
