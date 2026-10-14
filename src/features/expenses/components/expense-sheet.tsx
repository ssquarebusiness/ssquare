"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { businessConfig, type ExpensePaymentMethod } from "@/config/business";
import { Button } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Field, Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useProfiles } from "@/features/common/queries";
import { useStaff } from "@/features/staff/context";
import { parseAmount } from "@/lib/money";
import { qk } from "@/lib/query-keys";
import { istDateStr } from "@/lib/time";
import { createExpenseAction } from "../actions";
import { expenseSchema } from "../schema";

/** "Add expense" form in a bottom sheet. */
export function ExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("staff.expenses");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const me = useStaff();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: profiles } = useProfiles();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("maintenance");
  const [expenseBy, setExpenseBy] = useState(me.id);
  const [method, setMethod] = useState<ExpensePaymentMethod>("cash");
  const [spentOn, setSpentOn] = useState(istDateStr());
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const submit = () => {
    const parsed = expenseSchema.safeParse({
      spentOn, amount: parseAmount(amount), category, description, expenseBy, paymentMethod: method,
    });
    if (!parsed.success) {
      setInvalid(new Set(parsed.error.issues.map((i) => String(i.path[0]))));
      return;
    }
    start(async () => {
      const res = await createExpenseAction(parsed.data);
      if (!res.ok) {
        toast(te(res.error), "error");
        return;
      }
      qc.invalidateQueries({ queryKey: qk.expenses });
      toast(t("saved"));
      setAmount(""); setDescription(""); setInvalid(new Set());
      onClose();
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("add")}
      footer={<Button size="xl" block loading={pending} onClick={submit} className="mb-1">{t("save")}</Button>}>
      <div className="space-y-4">
        <Field label={t("amount")} htmlFor="exp-amount" error={invalid.has("amount") ? t("errors.amount") : undefined}>
          <Input id="exp-amount" inputMode="numeric" placeholder="₹" value={amount} onChange={(e) => setAmount(e.target.value)}
            aria-invalid={invalid.has("amount")} autoFocus />
        </Field>
        <Field label={t("description")} htmlFor="exp-desc" error={invalid.has("description") ? t("errors.description") : undefined}>
          <Input id="exp-desc" value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={invalid.has("description")}
            placeholder={t("descriptionPlaceholder")} />
        </Field>
        <Field label={t("category")} htmlFor="exp-cat">
          <Select id="exp-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            {businessConfig.expenseCategories.map((c) => <option key={c} value={c}>{tc(`expenseCategories.${c}`)}</option>)}
          </Select>
        </Field>
        <Field label={t("by")}>
          <Chips size="sm" name={t("by")} value={expenseBy} onChange={setExpenseBy}
            options={(profiles ?? []).filter((p) => p.is_active).map((p) => ({ value: p.id, label: p.display_name }))} />
        </Field>
        <Field label={t("method")}>
          <Chips size="sm" name={t("method")} value={method} onChange={setMethod}
            options={businessConfig.expensePaymentMethods.map((m) => ({ value: m, label: tc(`methods.${m}`) }))} />
        </Field>
        <Field label={t("date")} htmlFor="exp-date">
          <Input id="exp-date" type="date" value={spentOn} max={istDateStr()} onChange={(e) => e.target.value && setSpentOn(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}
