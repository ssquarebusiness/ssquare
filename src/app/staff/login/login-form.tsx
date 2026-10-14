"use client";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const t = useTranslations("staff.login");
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-4 rounded-3xl bg-white p-5 text-zinc-900 shadow-xl">
      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium text-zinc-700">{t("username")}</label>
        <Input id="username" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off"
          spellCheck={false} required placeholder={t("usernamePlaceholder")} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">{t("password")}</label>
        <div className="relative">
          <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password"
            required className="pr-12" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={t(show ? "hide" : "show")}
            className="absolute inset-y-0 right-0 px-3 text-zinc-500">
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>
      {state?.error && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{t(`errors.${state.error}`)}</p>}
      <Button type="submit" size="lg" block loading={pending}>{t("submit")}</Button>
      <p className="text-center text-xs text-zinc-500">{t("stayLoggedIn")}</p>
    </form>
  );
}
