import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/server";
import { ExpensesView } from "@/features/expenses/components/expenses-view";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  await requireStaff("expenses");
  return <ExpensesView />;
}
