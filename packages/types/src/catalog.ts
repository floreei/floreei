import { z } from "zod";
import { idSchema, moneySchema, paginationQuerySchema } from "./common";
import { productUnitSchema, type ProductUnit } from "./enums";

/** Categoria do catálogo. */
export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria").max(120),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export interface Category {
  id: string;
  companyId: string;
  name: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Produto do catálogo (flor/folhagem/insumo/material).
 * - `unit` é a **unidade-base** de consumo/estoque (ex.: HASTE).
 * - `purchaseUnit` + `packSize` descrevem a **embalagem de compra** (ex.: 1 MACO
 *   contém 5 hastes). `currentUnitCost` é o custo por unidade-base (última compra).
 */
export const productInputSchema = z.object({
  categoryId: idSchema,
  name: z.string().trim().min(2, "Informe o nome do produto").max(160),
  unit: productUnitSchema.default("UNIDADE"),
  purchaseUnit: productUnitSchema.default("UNIDADE"),
  packSize: z.coerce
    .number()
    .positive("O conteúdo do pacote deve ser maior que zero")
    .default(1),
  defaultPurchasePrice: moneySchema.default(0),
  defaultSalePrice: moneySchema.default(0),
  currentUnitCost: moneySchema.default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  /** URL da imagem do item (Firebase Storage) — opcional. */
  imageUrl: z
    .string()
    .max(1000)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});
export type ProductInput = z.infer<typeof productInputSchema>;

/** Filtros de listagem de produtos. */
export const productQuerySchema = paginationQuerySchema.extend({
  categoryId: idSchema.optional(),
  onlyActive: z.coerce.boolean().optional(),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  category?: Category;
  name: string;
  /** Unidade-base de consumo/estoque (ex.: HASTE). */
  unit: ProductUnit;
  /** Unidade de compra (embalagem, ex.: MACO). */
  purchaseUnit: ProductUnit;
  /** Quantas unidades-base vêm em 1 unidade de compra (ex.: 5 hastes por maço). */
  packSize: number;
  defaultPurchasePrice: number;
  defaultSalePrice: number;
  /** Custo por unidade-base (última compra ÷ packSize). */
  currentUnitCost: number;
  minStock: number;
  active: boolean;
  /** URL da imagem do item (Firebase Storage) ou null. */
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
