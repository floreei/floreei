import { z } from "zod";
import { moneySchema, paginationQuerySchema } from "./common";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

/** Centros de custo sugeridos (campo é livre, estes são atalhos na UI). */
export const COST_CENTERS = [
  "Aluguel",
  "Salários",
  "Transporte",
  "Marketing",
  "Embalagens",
  "Impostos",
  "Manutenção",
  "Outros",
] as const;

export const expenseInputSchema = z.object({
  description: z.string().trim().min(2, "Descreva a despesa").max(160),
  costCenter: z.string().trim().min(1, "Informe o centro de custo").max(80),
  amount: moneySchema.refine((v) => v > 0, "Valor deve ser maior que zero"),
  date: dateString,
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const expenseQuerySchema = paginationQuerySchema.extend({
  from: dateString.optional(),
  to: dateString.optional(),
  costCenter: z.string().trim().optional(),
});
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;

export interface Expense {
  id: string;
  companyId: string;
  description: string;
  costCenter: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
