import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireStaff } from "@/lib/auth/server";
import { StaffSettings } from "@/features/settings/components/staff-settings";
import { RatesSettings } from "@/features/settings/components/rates-settings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireStaff("owner");
  const t = await getTranslations("staff.settings");
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
      <StaffSettings />
      <RatesSettings />
    </div>
  );
}
