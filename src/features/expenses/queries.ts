"use client";
import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { qk } from "@/lib/query-keys";
import type { DateStr } from "@/lib/time";
import type { Expense } from "@/lib/types";

export async function fetchExpenses(from: DateStr, to: DateStr) {
  const { data, error } = await getSupabase()
    .from("expenses")
    .select("*")
    .gte("spent_on", from)
    .lte("spent_on", to)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export function useExpenses(from: DateStr, to: DateStr, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.expensesRange(from, to),
    enabled: opts.enabled ?? true,
    queryFn: () => fetchExpenses(from, to),
  });
}
