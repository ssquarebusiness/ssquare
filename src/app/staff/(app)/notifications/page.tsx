import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { NotificationsView } from "@/features/notifications/components/notifications-view";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireStaff();
  return <NotificationsView />;
}
