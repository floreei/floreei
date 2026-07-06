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

/** DRE por competência: o custo é o do que foi VENDIDO (COGS), não das compras. */
export interface DreReport {
  from: string;
  to: string;
  revenue: number; // receita bruta (eventos/vendas)
  cmv: number; // COGS: custo do que foi vendido (soma do custo das vendas)
  grossProfit: number; // receita - cmv
  grossMargin: number; // %
  purchasesTotal: number; // compras do período (saída de caixa, informativo)
  losses: number; // perdas de estoque valorizadas a custo
  expenses: DreExpenseLine[]; // despesas por centro de custo
  expensesTotal: number;
  netResult: number; // grossProfit - expensesTotal - losses
  netMargin: number; // %
}
