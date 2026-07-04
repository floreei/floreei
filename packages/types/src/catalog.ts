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

/** Produto do catálogo (flor/folhagem/insumo). */
export const productInputSchema = z.object({
  categoryId: idSchema,
  name: z.string().trim().min(2, "Informe o nome do produto").max(160),
  unit: productUnitSchema.default("UNIDADE"),
  defaultPurchasePrice: moneySchema.default(0),
  defaultSalePrice: moneySchema.default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
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
  unit: ProductUnit;
  defaultPurchasePrice: number;
  defaultSalePrice: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
