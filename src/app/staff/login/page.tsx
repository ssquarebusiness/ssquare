import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { LanguageSwitcher } from "@/components/staff/language-switcher";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const t = await getTranslations("staff.login");
  const { reason } = await searchParams;
  return (
    <main className="safe-top flex min-h-dvh flex-col bg-gradient-to-b from-brand-900 to-brand-950 px-5 text-white">
      <div className="flex justify-end pt-4">
        <LanguageSwitcher dark />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-10">
        <div className="text-center">
          <Logo className="mx-auto h-14 w-14" />
          <h1 className="mt-4 font-display text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-brand-200">{t("subtitle")}</p>
        </div>
        {reason === "inactive" && (
          <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">{t("errors.inactive")}</p>
        )}
        <LoginForm />
        <InstallPrompt variant="dark" />
      </div>
    </main>
  );
}
