import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { MoreView } from "@/features/staff/more-view";

export const metadata: Metadata = { title: "More" };

export default async function MorePage() {
  await requireStaff();
  return <MoreView />;
}
