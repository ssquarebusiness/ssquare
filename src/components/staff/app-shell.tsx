"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, CalendarDays, Home, Menu, Plus, Wallet, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useCan, useStaff } from "@/features/staff/context";
import { useUnreadCount } from "@/features/notifications/queries";
import { Wordmark } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { Permission } from "@/config/permissions";

type NavItem = { href: string; label: string; icon: typeof Home; need?: Permission; fab?: boolean };

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("staff.nav");
  const pathname = usePathname();
  const can = useCan();
  const profile = useStaff();
  const unread = useUnreadCount();
  const online = useOnline();

  const items: NavItem[] = [
    { href: "/staff", label: t("home"), icon: Home },
    { href: "/staff/bookings", label: t("bookings"), icon: CalendarDays, need: "all_bookings" },
    { href: "/staff/bookings/new", label: t("add"), icon: Plus, need: "create_booking", fab: true },
    { href: "/staff/expenses", label: t("expenses"), icon: Wallet, need: "expenses" },
    { href: "/staff/more", label: t("more"), icon: Menu },
  ].filter((i) => !i.need || can(i.need as Permission)) as NavItem[];

  // The most specific matching tab is active ("/staff/bookings/new" → Add, not Bookings).
  const activeHref = items
    .map((i) => i.href)
    .filter((h) => (h === "/staff" ? pathname === h : pathname === h || pathname.startsWith(h + "/")))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-zinc-50">
      <header className="safe-top sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/staff" aria-label="SSquare home"><Wordmark /></Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{profile.display_name}</span>
            <Link href="/staff/notifications" aria-label={t("notifications")} className="relative rounded-full p-2 text-zinc-700 hover:bg-zinc-100">
              <Bell className="size-6" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>
        </div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-100 py-1.5 text-sm font-medium text-amber-900">
            <WifiOff className="size-4" /> {t("offline")}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 pt-4 pb-28">{children}</main>

      <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white">
        <ul className="mx-auto flex max-w-2xl items-end justify-around px-2 pt-1.5">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-0.5 py-1 text-xs font-medium",
                    active ? "text-brand-700" : "text-zinc-500")}
                >
                  {item.fab ? (
                    <span className="-mt-6 flex size-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg ring-4 ring-white">
                      <Icon className="size-7" />
                    </span>
                  ) : (
                    <Icon className={cn("size-6", active && "stroke-[2.5]")} />
                  )}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
