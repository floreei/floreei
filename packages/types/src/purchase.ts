import { z } from "zod";
import {
  dateStringSchema,
  idSchema,
  moneySchema,
  paginationQuerySchema,
  quantitySchema,
} from "./common";
import {
  invalidQuantityForUnit,
  productUnitSchema,
  purchaseStatusSchema,
  type ProductUnit,
  type PurchaseStatus,
} from "./enums";

/** Item de uma compra (entrada de estoque/insumo). */
export const purchaseItemInputSchema = z
  .object({
    productId: idSchema.nullable().optional(),
    description: z.string().trim().min(1, "Descreva o item").max(200),
    quantity: quantitySchema,
    unit: productUnitSchema.default("UNIDADE"),
    unitPrice: moneySchema,
  })
  .refine((v) => invalidQuantityForUnit(v.quantity, v.unit) === null, {
    message: "Quantidade deve ser um número inteiro",
    path: ["quantity"],
  });
export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;

/** Dados para registrar/editar uma compra. */
export const purchaseInputSchema = z.object({
  supplierId: idSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  /** Entrega prevista (opcional). */
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  deliveryTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  freight: moneySchema.default(0),
  status: purchaseStatusSchema.default("RECEIVED"),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  items: z.array(purchaseItemInputSchema).min(1, "Adicione ao menos um item"),
});
export type PurchaseInput = z.infer<typeof purchaseInputSchema>;

export const purchaseQuerySchema = paginationQuerySchema.extend({
  supplierId: idSchema.optional(),
  status: purchaseStatusSchema.optional(),
  unpaidOnly: z.coerce.boolean().optional(),
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
});
export type PurchaseQuery = z.infer<typeof purchaseQuerySchema>;

export interface PurchaseItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  companyId: string;
  supplierId: string;
  supplier?: { id: string; name: string };
  date: string;
  deliveryDate: string | null;
  deliveryTime: string | null;
  status: PurchaseStatus;
  itemsTotal: number;
  freight: number;
  total: number;
  paidAmount: number;
  /** total - paidAmount */
  balanceDue: number;
  notes: string | null;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseAttachment {
  id: string;
  purchaseId: string;
  label: string;
  url: string;
  createdAt: string;
}
