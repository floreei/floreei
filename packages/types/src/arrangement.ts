import { z } from "zod";
import { idSchema, moneySchema, paginationQuerySchema, quantitySchema } from "./common";
import type { ProductUnit } from "./enums";
import { marginPercent, roundMoney, sumMoney } from "./quote-calculator";

/** Componente da ficha técnica: um insumo e a quantidade (na unidade-base). */
export const arrangementItemInputSchema = z.object({
  productId: idSchema,
  quantity: quantitySchema,
});
export type ArrangementItemInput = z.infer<typeof arrangementItemInputSchema>;

/**
 * Como o preço do buquê é definido:
 * - `FIXED`: preço digitado.
 * - `PROFIT_VALUE`: lucro em R$ → preço = custo + lucro.
 * - `MARGIN_PCT`: margem % sobre a venda → preço = custo / (1 − %/100).
 * Nos dois últimos o preço **acompanha o custo** (recalculado no mapper).
 */
export const arrangementPricingModeSchema = z.enum([
  "FIXED",
  "PROFIT_VALUE",
  "MARGIN_PCT",
]);
export type ArrangementPricingMode = z.infer<
  typeof arrangementPricingModeSchema
>;

/**
 * Preço de venda efetivo do buquê a partir do custo e da política. Fonte de
 * verdade usada no back (mapper) e no preview do front.
 */
export function arrangementSalePrice(
  cost: number,
  mode: ArrangementPricingMode,
  opts: { salePrice?: number; profitValue?: number; profitPct?: number },
): number {
  if (mode === "PROFIT_VALUE") {
    return roundMoney(cost + (opts.profitValue ?? 0));
  }
  if (mode === "MARGIN_PCT") {
    const pct = Math.min(Math.max(opts.profitPct ?? 0, 0), 99.99);
    return roundMoney(cost / (1 - pct / 100));
  }
  return roundMoney(opts.salePrice ?? 0);
}

/** Produto composto / buquê: nome, política de preço e a ficha técnica (receita). */
export const arrangementInputSchema = z.object({
  categoryId: idSchema.nullable().optional(),
  name: z.string().trim().min(2, "Informe o nome do buquê").max(160),
  pricingMode: arrangementPricingModeSchema.default("FIXED"),
  salePrice: moneySchema.default(0),
  profitValue: z.coerce.number().min(0).default(0),
  profitPct: z.coerce
    .number()
    .min(0)
    .max(99.99, "Margem deve ser menor que 100%")
    .default(0),
  active: z.boolean().default(true),
  /** Foto do buquê (URL do Firebase Storage) — usada na loja online. */
  imageUrl: z
    .string()
    .trim()
    .max(1000)
    .url("URL de imagem inválida")
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  /** Publicar este buquê na loja online. */
  storePublished: z.boolean().default(false),
  items: z
    .array(arrangementItemInputSchema)
    .min(1, "Adicione ao menos um insumo à ficha técnica"),
  /**
   * Quantidade a **produzir** ao cadastrar (opcional): baixa `produce ×` a ficha
   * técnica do estoque, registrando a fabricação de N buquês. Ignorado na edição.
   */
  produce: z.coerce.number().int().min(0).optional(),
});
export type ArrangementInput = z.infer<typeof arrangementInputSchema>;

export const arrangementQuerySchema = paginationQuerySchema.extend({
  categoryId: idSchema.optional(),
  onlyActive: z.coerce.boolean().optional(),
});
export type ArrangementQuery = z.infer<typeof arrangementQuerySchema>;

/** Linha da ficha técnica já resolvida com custo. */
export interface ArrangementItem {
  id: string;
  productId: string;
  productName: string;
  unit: ProductUnit;
  quantity: number;
  /** Custo por unidade-base do insumo no momento da leitura. */
  unitCost: number;
  /** quantity × unitCost */
  lineCost: number;
}

export interface Arrangement {
  id: string;
  companyId: string;
  categoryId: string | null;
  categoryName?: string | null;
  name: string;
  /** Como o preço é definido (política). */
  pricingMode: ArrangementPricingMode;
  /** Lucro em R$ (modo PROFIT_VALUE). */
  profitValue: number;
  /** Margem % sobre a venda alvo (modo MARGIN_PCT). */
  profitPct: number;
  /** Preço de venda efetivo (derivado do custo + política). */
  salePrice: number;
  active: boolean;
  /** Foto do buquê (URL) — vitrine da loja online. */
  imageUrl: string | null;
  /** Publicado na loja online. */
  storePublished: boolean;
  items: ArrangementItem[];
  /** Σ lineCost (materiais diretos). */
  cost: number;
  /** salePrice − cost */
  margin: number;
  /** margem % sobre a venda */
  marginPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArrangementTotals {
  cost: number;
  margin: number;
  marginPercent: number;
}

/**
 * Calcula o custo (materiais diretos), a margem e o % de um buquê. Usado no
 * backend e no cálculo ao vivo do front — a fonte de verdade do custeio.
 */
export function calculateArrangement(
  components: { quantity: number; unitCost: number }[],
  salePrice: number,
): ArrangementTotals {
  const cost = sumMoney(
    components.map((c) => roundMoney(c.quantity * c.unitCost)),
  );
  const margin = roundMoney(salePrice - cost);
  return { cost, margin, marginPercent: marginPercent(margin, salePrice) };
}
