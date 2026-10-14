"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BarChart3, ChevronRight, FileDown, Globe, KeyRound, LogOut, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { LanguageSwitcher } from "@/components/staff/language-switcher";
import { PushToggle } from "@/features/notifications/components/push-toggle";
import { changeOwnPasswordAction, logoutAction } from "@/features/auth/actions";
import { useCan, useIsOwner, useStaff } from "./context";

export function MoreView() {
  const t = useTranslations("staff.more");
  const me = useStaff();
  const can = useCan();
  const isOwner = useIsOwner();
  const [pwOpen, setPwOpen] = useState(false);

  const links = [
    can("analytics") && { href: "/staff/analytics", icon: BarChart3, label: t("analytics") },
    can("reports") && { href: "/staff/reports", icon: FileDown, label: t("reports") },
    isOwner && { href: "/staff/settings", icon: Settings, label: t("settings") },
    { href: "/staff/notifications", icon: Bell, label: t("notifications") },
    { href: "/", icon: Globe, label: t("website") },
  ].filter(Boolean) as { href: string; icon: typeof Bell; label: string }[];

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold">{me.display_name}</p>
          <p className="text-sm text-zinc-500">@{me.username} · {t(`roles.${me.role}`)}</p>
        </div>
        <LanguageSwitcher />
      </Card>

      <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {links.map(({ href, icon: Icon, label }) => (
          <li key={href} className="border-b border-zinc-100 last:border-0">
            <Link href={href} className="flex items-center gap-3 px-4 py-4 font-medium active:bg-zinc-50">
              <Icon className="size-5 text-brand-700" /> <span className="flex-1">{label}</span>
              <ChevronRight className="size-5 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>

      <Card className="space-y-3">
        <p className="font-semibold">{t("pushTitle")}</p>
        <p className="text-sm text-zinc-500">{t(isOwner ? "pushOwner" : "pushStaff")}</p>
        <PushToggle />
      </Card>

      <InstallPrompt />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => setPwOpen(true)}><KeyRound className="size-5" /> {t("password")}</Button>
        <form action={logoutAction}>
          <Button type="submit" variant="dangerOutline" block><LogOut className="size-5" /> {t("logout")}</Button>
        </form>
      </div>

      <PasswordSheet open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

function PasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("staff.more");
  const te = useTranslations("errors");
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pending, start] = useTransition();
  const mismatch = pw2.length > 0 && pw !== pw2;

  return (
    <Sheet open={open} onClose={onClose} title={t("password")}>
      <div className="space-y-4">
        <Field label={t("newPassword")} htmlFor="pw" hint={t("passwordHint")}>
          <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label={t("confirmPassword")} htmlFor="pw2" error={mismatch ? t("mismatch") : undefined}>
          <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </Field>
        <Button block size="lg" loading={pending} disabled={pw.length < 8 || pw !== pw2}
          onClick={() => start(async () => {
            const res = await changeOwnPasswordAction(pw);
            if (!res.ok) return toast(te(res.error), "error");
            toast(t("passwordChanged"));
            setPw(""); setPw2(""); onClose();
          })}>
          {t("savePassword")}
        </Button>
      </div>
    </Sheet>
  );
}
