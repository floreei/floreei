import { z } from "zod";
import {
  idSchema,
  moneySchema,
  paginationQuerySchema,
} from "./common";
import {
  eventStatusSchema,
  eventTypeSchema,
  type EventStatus,
  type EventType,
  type ProductUnit,
} from "./enums";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use AAAA-MM-DD)");

const optionalUuid = idSchema.nullable().optional();

/** Criação manual de um evento (venda sem orçamento prévio). */
export const eventInputSchema = z.object({
  type: eventTypeSchema.default("ORDER"),
  customerId: idSchema.nullable().optional(),
  title: z.string().trim().min(2, "Informe um título").max(180),
  date: dateString,
  location: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  responsibleUserId: optionalUuid,
  status: eventStatusSchema.default("CONFIRMED"),
  soldValue: moneySchema.default(0),
  receivedValue: moneySchema.default(0),
  estimatedProfit: moneySchema.default(0),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type EventInput = z.infer<typeof eventInputSchema>;

/** Atualização parcial de um evento. */
export const eventUpdateSchema = eventInputSchema.partial();
export type EventUpdate = z.infer<typeof eventUpdateSchema>;

/** Item de uma venda rápida (referencia um produto do catálogo). */
export const quickSaleItemSchema = z.object({
  productId: idSchema,
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  /** Preço de venda deste item nesta venda (sobrepõe o preço padrão do catálogo). */
  unitSalePrice: z.coerce.number().nonnegative().optional(),
});
export type QuickSaleItem = z.infer<typeof quickSaleItemSchema>;

/** Venda rápida de balcão: produtos do catálogo OU valor livre. */
export const quickSaleSchema = z
  .object({
    customerId: idSchema.nullable().optional(),
    title: z.string().trim().max(180).optional(),
    date: dateString.optional(),
    items: z.array(quickSaleItemSchema).optional(),
    amount: z.coerce.number().nonnegative().optional(),
  })
  .refine((v) => (v.items && v.items.length > 0) || (v.amount ?? 0) > 0, {
    message: "Adicione produtos ou informe um valor",
    path: ["amount"],
  });
export type QuickSaleInput = z.infer<typeof quickSaleSchema>;

/** Conversão de um orçamento aprovado em evento (venda). */
export const convertQuoteSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do evento").max(180),
  date: dateString,
  location: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  responsibleUserId: optionalUuid,
});
export type ConvertQuoteInput = z.infer<typeof convertQuoteSchema>;

/** Filtros de listagem de eventos. */
export const eventQuerySchema = paginationQuerySchema.extend({
  type: eventTypeSchema.optional(),
  status: eventStatusSchema.optional(),
  customerId: idSchema.optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});
export type EventQuery = z.infer<typeof eventQuerySchema>;

/** Item vendido numa venda (flor, quantidade e preço). */
export interface EventItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unit: ProductUnit;
  unitSalePrice: number;
  lineTotal: number;
}

export interface Event {
  id: string;
  companyId: string;
  type: EventType;
  customerId: string | null;
  customer?: { id: string; name: string };
  quoteId: string | null;
  responsibleUserId: string | null;
  title: string;
  date: string;
  location: string | null;
  status: EventStatus;
  soldValue: number;
  receivedValue: number;
  estimatedProfit: number;
  realProfit: number | null;
  notes: string | null;
  items: EventItem[];
  createdAt: string;
  updatedAt: string;
}
