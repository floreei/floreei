import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

export const reportQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;

export interface ReportSummary {
  revenue: number; // valor vendido nos eventos do período
  purchasesCost: number; // total comprado no período
  grossProfit: number; // revenue - purchasesCost
  eventsCount: number;
  received: number; // recebido no período (caixa)
  paid: number; // pago no período (caixa)
}

export interface ProductRanking {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface PartyRanking {
  id: string;
  name: string;
  total: number;
  count: number;
}

export interface ReportData {
  from: string;
  to: string;
  summary: ReportSummary;
  topProducts: ProductRanking[];
  suppliers: PartyRanking[];
  customers: PartyRanking[];
}
