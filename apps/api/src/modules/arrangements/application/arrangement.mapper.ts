import type { Arrangement, ArrangementItem } from "@sistema-flores/types";
import {
  arrangementSalePrice,
  calculateArrangement,
  roundMoney,
} from "@sistema-flores/types";
import { ArrangementItemEntity } from "../infrastructure/arrangement-item.entity";
import { ArrangementEntity } from "../infrastructure/arrangement.entity";

function toItem(item: ArrangementItemEntity): ArrangementItem {
  const unitCost = item.product?.currentUnitCost ?? 0;
  return {
    id: item.id,
    productId: item.productId,
    productName: item.product?.name ?? "",
    unit: item.product?.unit ?? "UNIDADE",
    quantity: item.quantity,
    unitCost,
    lineCost: roundMoney(item.quantity * unitCost),
  };
}

/** Converte a entidade em DTO já com o custo/margem calculados. */
export function toArrangement(entity: ArrangementEntity): Arrangement {
  const items = (entity.items ?? [])
    .map(toItem)
    .sort((a, b) => a.productName.localeCompare(b.productName));
  const components = items.map((i) => ({
    quantity: i.quantity,
    unitCost: i.unitCost,
  }));
  const cost = calculateArrangement(components, 0).cost;
  // Preço derivado do custo ATUAL + política (nos modos de lucro acompanha o custo).
  const salePrice = arrangementSalePrice(cost, entity.pricingMode, {
    salePrice: entity.salePrice,
    profitValue: entity.profitValue,
    profitPct: entity.profitPct,
  });
  const totals = calculateArrangement(components, salePrice);
  return {
    id: entity.id,
    companyId: entity.companyId,
    categoryId: entity.categoryId,
    categoryName: entity.category?.name ?? null,
    name: entity.name,
    pricingMode: entity.pricingMode,
    profitValue: entity.profitValue,
    profitPct: entity.profitPct,
    salePrice,
    active: entity.active,
    items,
    cost: totals.cost,
    margin: totals.margin,
    marginPercent: totals.marginPercent,
    createdAt:
      entity.createdAt instanceof Date
        ? entity.createdAt.toISOString()
        : entity.createdAt,
    updatedAt:
      entity.updatedAt instanceof Date
        ? entity.updatedAt.toISOString()
        : entity.updatedAt,
  };
}
