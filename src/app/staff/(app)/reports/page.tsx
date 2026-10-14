import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { ReportsView } from "@/features/reports/reports-view";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireStaff("reports");
  return <ReportsView />;
}
