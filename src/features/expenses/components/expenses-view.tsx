"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { initialRange, RangePicker } from "@/components/staff/range-picker";
import { useNameOf } from "@/features/common/queries";
import { useIsOwner } from "@/features/staff/context";
import { formatINR, sum } from "@/lib/money";
import { qk } from "@/lib/query-keys";
import { formatDate } from "@/lib/time";
import type { Expense } from "@/lib/types";
import { deleteExpenseAction } from "../actions";
import { useExpenses } from "../queries";
import { ExpenseSheet } from "./expense-sheet";

export function ExpensesView() {
  const t = useTranslations("staff.expenses");
  const locale = useLocale() as Locale;
  const [range, setRange] = useState(initialRange("thisMonth"));
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useExpenses(range.from, range.to);

  const byDate = new Map<string, Expense[]>();
  for (const e of data ?? []) byDate.set(e.spent_on, [...(byDate.get(e.spent_on) ?? []), e]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> {t("add")}</Button>
      </div>
      <RangePicker value={range} onChange={setRange} />
      <Card className="flex items-center justify-between">
        <span className="text-zinc-600">{t("total")}</span>
        <span className="text-2xl font-bold">{formatINR(sum(data ?? [], (e) => e.amount))}</span>
      </Card>
      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : byDate.size === 0 ? (
        <Empty title={t("empty")} />
      ) : (
        [...byDate.entries()].map(([date, items]) => (
          <section key={date} className="space-y-2">
            <h2 className="flex justify-between text-sm font-semibold text-zinc-500">
              <span>{formatDate(date, locale)}</span>
              <span>{formatINR(sum(items, (e) => e.amount))}</span>
            </h2>
            <ul className="space-y-2">{items.map((e) => <ExpenseRow key={e.id} expense={e} />)}</ul>
          </section>
        ))
      )}
      <ExpenseSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function ExpenseRow({ expense: e }: { expense: Expense }) {
  const t = useTranslations("staff.expenses");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const nameOf = useNameOf();
  const isOwner = useIsOwner();
  const toast = useToast();
  const qc = useQueryClient();
  const [pending, start] = useTransition();

  const remove = () => {
    if (!confirm(t("confirmDelete"))) return;
    start(async () => {
      const res = await deleteExpenseAction(e.id);
      if (!res.ok) return toast(te(res.error), "error");
      qc.invalidateQueries({ queryKey: qk.expenses });
      toast(t("deleted"));
    });
  };

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{e.description}</p>
        <p className="text-sm text-zinc-500">
          {tc(`expenseCategories.${e.category}`)} · {nameOf(e.expense_by)} · {tc(`methods.${e.payment_method}`)}
        </p>
      </div>
      <span className="font-bold">{formatINR(e.amount)}</span>
      {isOwner && (
        <button onClick={remove} disabled={pending} aria-label={t("delete")} className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600">
          {pending ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
        </button>
      )}
    </li>
  );
}
