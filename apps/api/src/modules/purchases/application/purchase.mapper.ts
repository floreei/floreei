import type { Purchase, PurchaseItem } from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { PurchaseItemEntity } from "../infrastructure/purchase-item.entity";
import { PurchaseEntity } from "../infrastructure/purchase.entity";

const iso = (v: Date | string) => (v instanceof Date ? v.toISOString() : v);

function toItem(item: PurchaseItemEntity): PurchaseItem {
  return {
    id: item.id,
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  };
}

export function toPurchase(purchase: PurchaseEntity): Purchase {
  const items = [...(purchase.items ?? [])].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1,
  );
  return {
    id: purchase.id,
    companyId: purchase.companyId,
    supplierId: purchase.supplierId,
    supplier: purchase.supplier
      ? { id: purchase.supplier.id, name: purchase.supplier.name }
      : undefined,
    date: purchase.date,
    deliveryDate: purchase.deliveryDate ?? null,
    deliveryTime: purchase.deliveryTime ?? null,
    status: purchase.status,
    itemsTotal: purchase.itemsTotal,
    freight: purchase.freight,
    total: purchase.total,
    paidAmount: purchase.paidAmount,
    balanceDue: roundMoney(purchase.total - purchase.paidAmount),
    notes: purchase.notes,
    items: items.map(toItem),
    createdAt: iso(purchase.createdAt),
    updatedAt: iso(purchase.updatedAt),
  };
}
