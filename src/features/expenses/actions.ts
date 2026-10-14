"use server";
import { staffFor } from "@/lib/auth/server";
import { errorKey } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { expenseSchema, type ExpenseInput } from "./schema";

export async function createExpenseAction(input: ExpenseInput): Promise<ActionResult> {
  const actor = await staffFor("expenses");
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidData" };
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    spent_on: v.spentOn,
    amount: v.amount,
    category: v.category,
    description: v.description,
    expense_by: v.expenseBy,
    payment_method: v.paymentMethod,
    created_by: actor.id,
  });
  return error ? { ok: false, error: errorKey(error) } : { ok: true, data: undefined };
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const actor = await staffFor("owner");
  if (!actor) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  return error ? { ok: false, error: errorKey(error) } : { ok: true, data: undefined };
}
