import { z } from "zod";
import {
  idSchema,
  moneySchema,
  paginationQuerySchema,
  quantitySchema,
} from "./common";
import {
  productUnitSchema,
  quoteStatusSchema,
  type ProductUnit,
  type QuoteStatus,
} from "./enums";

/** Item de um orçamento (entrada). Os totais são calculados no servidor. */
export const quoteItemInputSchema = z.object({
  productId: idSchema.nullable().optional(),
  description: z.string().trim().min(1, "Descreva o item").max(200),
  quantity: quantitySchema,
  unit: productUnitSchema.default("UNIDADE"),
  purchasePrice: moneySchema,
  salePrice: moneySchema,
});
export type QuoteItemInput = z.infer<typeof quoteItemInputSchema>;

/** Dados para criar/editar um orçamento. */
export const quoteInputSchema = z.object({
  customerId: idSchema,
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  items: z.array(quoteItemInputSchema).default([]),
});
export type QuoteInput = z.infer<typeof quoteInputSchema>;

/** Transição de status (enviar, rejeitar, expirar). */
export const quoteStatusUpdateSchema = z.object({
  status: quoteStatusSchema,
});
export type QuoteStatusUpdate = z.infer<typeof quoteStatusUpdateSchema>;

/** Filtros de listagem de orçamentos. */
export const quoteQuerySchema = paginationQuerySchema.extend({
  status: quoteStatusSchema.optional(),
  customerId: idSchema.optional(),
});
export type QuoteQuery = z.infer<typeof quoteQuerySchema>;

export interface QuoteItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unit: ProductUnit;
  purchasePrice: number;
  salePrice: number;
  lineCost: number;
  lineSale: number;
  lineProfit: number;
  marginPct: number;
}

export interface Quote {
  id: string;
  companyId: string;
  number: number;
  customerId: string;
  customer?: { id: string; name: string };
  eventId: string | null;
  status: QuoteStatus;
  validUntil: string | null;
  notes: string | null;
  totalCost: number;
  totalSale: number;
  totalProfit: number;
  marginPct: number;
  items: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}
