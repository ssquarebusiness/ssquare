import { z } from "zod";
import { businessConfig } from "@/config/business";

export const expenseSchema = z.object({
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().int().min(1).max(10_000_000),
  category: z.enum(businessConfig.expenseCategories),
  description: z.string().trim().min(1).max(300),
  expenseBy: z.uuid(),
  paymentMethod: z.enum(businessConfig.expensePaymentMethods),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;
