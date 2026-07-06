import { z } from "zod";
import { idSchema, quantitySchema } from "./common";
import {
  stockMovementTypeSchema,
  type ProductUnit,
  type StockMovementType,
  type StockSource,
} from "./enums";

/** Lançamento manual de movimentação de estoque (perda, ajuste, entrada/saída avulsa). */
export const stockMovementInputSchema = z.object({
  productId: idSchema,
  type: stockMovementTypeSchema,
  quantity: quantitySchema,
  lot: z
    .string()
    .trim()
    .max(60)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type StockMovementInput = z.infer<typeof stockMovementInputSchema>;

/**
 * Ajuste manual de saldo: informa a **quantidade real** em estoque (contagem
 * física) e o sistema registra a correção (para cima = AJUSTE; para baixo = saída
 * de correção, neutra no DRE — perdas reais usam o tipo PERDA no movimento).
 */
export const stockAdjustSchema = z.object({
  productId: idSchema,
  balance: z.coerce.number().min(0, "Saldo não pode ser negativo"),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;

export const stockMovementQuerySchema = z.object({
  productId: idSchema.optional(),
});
export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>;

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: StockMovementType;
  source: StockSource;
  quantity: number;
  lot: string | null;
  expiresAt: string | null;
  date: string;
  notes: string | null;
  createdAt: string;
}

/** Saldo consolidado de um produto em estoque. */
export interface StockLevel {
  productId: string;
  productName: string;
  categoryName: string | null;
  unit: ProductUnit;
  onHand: number;
  /** Custo por unidade-base (última compra). */
  unitCost: number;
  /** onHand × unitCost (estoque valorizado). */
  value: number;
  minStock: number;
  low: boolean;
}

/** Lote próximo do vencimento. */
export interface ExpiringLot {
  productId: string;
  productName: string;
  lot: string | null;
  expiresAt: string;
  quantity: number;
}

export interface StockOverview {
  levels: StockLevel[];
  lowCount: number;
  /** Soma de todos os `value` (estoque valorizado total). */
  totalValue: number;
  expiringSoon: ExpiringLot[];
}
