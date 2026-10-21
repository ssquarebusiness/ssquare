import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { LanguageSwitcher } from "@/components/staff/language-switcher";
import { FullLogo } from "@/components/logo";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const t = await getTranslations("staff.login");
  const { reason } = await searchParams;
  return (
    <main className="safe-top flex min-h-dvh flex-col bg-canvas px-5 text-ink">
      <div className="flex justify-end pt-4">
        <LanguageSwitcher />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-10">
        <div className="text-center">
          <div className="mx-auto w-40 rounded-[26px] bg-white p-1.5 shadow-card"><FullLogo priority sizes="160px" className="w-full rounded-[20px]" /></div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-zinc-500">{t("subtitle")}</p>
        </div>
        {reason === "inactive" && (
          <p role="alert" className="rounded-2xl bg-booked-soft px-4 py-3 text-center text-sm text-booked-ink">{t("errors.inactive")}</p>
        )}
        <LoginForm />
        <InstallPrompt />
      </div>
    </main>
  );
}
