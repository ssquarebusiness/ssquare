import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("public.notFound");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-950">{t("title")}</h1>
      <p className="mt-2 text-zinc-600">{t("text")}</p>
      <Link href="/" className={buttonClass("primary", "lg", "mt-6")}>{t("home")}</Link>
    </div>
  );
}
