import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

export const dreQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});
export type DreQuery = z.infer<typeof dreQuerySchema>;

export interface DreExpenseLine {
  costCenter: string;
  amount: number;
}

/** DRE simplificada do período (regime de competência pelas datas dos eventos/compras). */
export interface DreReport {
  from: string;
  to: string;
  revenue: number; // receita bruta (eventos)
  cmv: number; // custo das mercadorias (compras)
  grossProfit: number; // receita - cmv
  grossMargin: number; // %
  expenses: DreExpenseLine[]; // despesas por centro de custo
  expensesTotal: number;
  netResult: number; // grossProfit - expensesTotal
  netMargin: number; // %
}
