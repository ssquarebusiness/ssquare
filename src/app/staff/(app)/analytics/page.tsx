import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { AnalyticsView } from "@/features/analytics/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireStaff("analytics");
  return <AnalyticsView />;
}
