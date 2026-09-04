import { z } from "zod";
import { insightsQuerySchema } from "./event";
import type { ProductUnit } from "./enums";

/** Mesmo filtro dos insights — a tela passa período + filtros da listagem. */
export const periodResultQuerySchema = insightsQuerySchema;
export type PeriodResultQuery = z.infer<typeof periodResultQuerySchema>;

export interface PeriodResultItem {
  description: string;
  quantity: number;
  unit: ProductUnit;
  unitSalePrice: number;
  /** null em itens de vendas anteriores ao custo por item. */
  unitCost: number | null;
  lineTotal: number;
  lineCost: number | null;
  lineProfit: number | null;
}

export interface PeriodResultOrder {
  id: string;
  date: string;
  title: string;
  customerName: string | null;
  soldValue: number;
  cost: number;
  profit: number;
  items: PeriodResultItem[];
}

export interface PeriodResultExpense {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  overdue: boolean;
}

export interface PeriodResultExpenseGroup {
  costCenter: string;
  total: number;
  entries: PeriodResultExpense[];
}

/**
 * Resultado do período (tela Atacado): vendas com lucro por pedido e por item,
 * despesas lançadas por vencimento no período e o líquido = lucro bruto − despesas.
 * Despesas são da empresa toda (não têm canal).
 */
export interface PeriodResult {
  from: string;
  to: string;
  /** true quando a query não trouxe período e a API usou o mês corrente. */
  defaultedPeriod: boolean;
  sales: {
    count: number;
    revenue: number;
    cost: number;
    grossProfit: number;
    /** 0–100; null quando revenue = 0. */
    grossMargin: number | null;
  };
  orders: PeriodResultOrder[];
  expenses: {
    total: number;
    paidTotal: number;
    unpaidTotal: number;
    /** Ordenado por total desc. */
    groups: PeriodResultExpenseGroup[];
  };
  net: {
    value: number;
    /** 0–100; null quando revenue = 0. */
    margin: number | null;
  };
}
