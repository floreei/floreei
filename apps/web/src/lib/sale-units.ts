import type { ProductUnit } from "@sistema-flores/types";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Dados de um produto necessários para escolher a unidade de venda. */
export interface UnitPricing {
  /** Quantas unidades-base vêm em 1 unidade de compra (ex.: 5 hastes/maço). */
  packSize?: number;
  /** Unidade de compra (embalagem, ex.: MACO). */
  purchaseUnit?: ProductUnit;
  /** Unidade-base de consumo (ex.: HASTE). */
  unit?: ProductUnit;
  /** Preço de venda por unidade de compra (ex.: preço do maço). */
  price: number;
}

/** Produto de pacote (1 compra = N base) pode ser vendido por maço ou por haste. */
export const hasUnitChoice = (p: UnitPricing): boolean => (p.packSize ?? 1) > 1;

/** Unidade padrão de venda: a de compra (maço) se for pacote; senão a base. */
export const defaultSaleUnit = (p: UnitPricing): ProductUnit | undefined =>
  hasUnitChoice(p) ? p.purchaseUnit : p.unit;

/**
 * Preço sugerido para a unidade escolhida: maço = preço cheio; haste = preço do
 * maço ÷ conteúdo do pacote. Continua editável na venda.
 */
export function suggestedUnitPrice(
  p: UnitPricing,
  saleUnit?: ProductUnit,
): number {
  if (!hasUnitChoice(p)) return p.price;
  return saleUnit === p.purchaseUnit ? p.price : round2(p.price / (p.packSize ?? 1));
}

/** Dados de custo do produto para sugerir o custo de uma linha. */
export interface UnitCosting extends UnitPricing {
  /** Custo por unidade de compra (ex.: custo do maço). */
  cost: number;
}

/**
 * Custo por unidade de compra: custo atual (por haste) × packSize; se o custo
 * atual estiver zerado, o preço de compra padrão (que já é por maço).
 */
export function productPackCost(p: {
  currentUnitCost: number;
  defaultPurchasePrice: number;
  packSize?: number;
}): number {
  const pack = p.packSize ?? 1;
  if (p.currentUnitCost > 0) return round2(p.currentUnitCost * pack);
  return p.defaultPurchasePrice;
}

/** Custo sugerido na unidade escolhida (mesma regra do preço: maço cheio, haste ÷ pacote). */
export function suggestedUnitCost(p: UnitCosting, saleUnit?: ProductUnit): number {
  if (!hasUnitChoice(p)) return p.cost;
  return saleUnit === p.purchaseUnit ? p.cost : round2(p.cost / (p.packSize ?? 1));
}
