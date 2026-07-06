import { z } from "zod";
import {
  idSchema,
  moneySchema,
  paginationQuerySchema,
} from "./common";
import {
  eventStatusSchema,
  eventTypeSchema,
  productUnitSchema,
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

/** Item de uma venda: um **buquê** (arrangementId) OU um **insumo** (productId). */
export const quickSaleItemSchema = z
  .object({
    productId: idSchema.nullable().optional(),
    arrangementId: idSchema.nullable().optional(),
    quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
    /**
     * Unidade em que `quantity` está expressa: a unidade de compra (ex.: MACO) ou
     * a unidade-base de consumo (ex.: HASTE). Ausente ⇒ unidade-base (compat).
     */
    saleUnit: productUnitSchema.optional(),
    /** Preço de venda deste item nesta venda (sobrepõe o preço sugerido). */
    unitSalePrice: z.coerce.number().nonnegative().optional(),
  })
  .refine((v) => Boolean(v.productId) !== Boolean(v.arrangementId), {
    message: "Informe um produto OU um buquê",
    path: ["productId"],
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

/**
 * Edição dos itens de uma venda já existente. Os itens sempre governam estoque e
 * custo; `pricingMode` decide a receita: `ITEMS` = soma das linhas, `FIXED` =
 * `soldValue` informado (a venda continua com o valor fixo).
 */
export const editSaleItemsSchema = z
  .object({
    items: z.array(quickSaleItemSchema).min(1, "Adicione ao menos um item"),
    pricingMode: z.enum(["ITEMS", "FIXED"]),
    soldValue: z.coerce.number().nonnegative().optional(),
  })
  .refine((v) => v.pricingMode !== "FIXED" || v.soldValue !== undefined, {
    message: "Informe o valor da venda",
    path: ["soldValue"],
  });
export type EditSaleItemsInput = z.infer<typeof editSaleItemsSchema>;

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

/** Item vendido numa venda (insumo avulso ou buquê). */
export interface EventItem {
  id: string;
  productId: string | null;
  arrangementId: string | null;
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
  /** Custo do que foi vendido (COGS), persistido na venda. */
  cost: number;
  receivedValue: number;
  estimatedProfit: number;
  realProfit: number | null;
  notes: string | null;
  items: EventItem[];
  createdAt: string;
  updatedAt: string;
}
