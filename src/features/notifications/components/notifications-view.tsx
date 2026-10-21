"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { qk } from "@/lib/query-keys";
import { formatDate, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { markAllReadAction } from "../actions";
import { useNotifications } from "../queries";
import { PushToggle } from "./push-toggle";

export function NotificationsView() {
  const t = useTranslations("staff.notifications");
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const { data, isLoading } = useNotifications();
  const unread = data?.some((n) => !n.read_at);

  useEffect(() => {
    if (!unread) return;
    const id = setTimeout(() => markAllReadAction().then(() => qc.invalidateQueries({ queryKey: qk.notifications })), 1500);
    return () => clearTimeout(id);
  }, [unread, qc]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{t("title")}</h1>
      <Card><PushToggle /></Card>
      {isLoading ? <div className="flex justify-center py-8"><Spinner /></div> : !data?.length ? (
        <Empty icon={<Bell className="size-8" />} title={t("empty")} />
      ) : (
        <ul className="space-y-2">
          {data.map((n) => (
            <li key={n.id}>
              <Link href={n.url ?? "/staff"} className={cn("block rounded-2xl border bg-white p-4", n.read_at ? "border-zinc-200" : "border-brand-300 bg-brand-50")}>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-zinc-600">{n.body}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {formatDate(new Date(n.created_at), locale, { day: "numeric", month: "short" })}, {formatTime(n.created_at, locale)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
