import type { Quote, QuoteItem } from "@sistema-flores/types";
import { QuoteItemEntity } from "../infrastructure/quote-item.entity";
import { QuoteEntity } from "../infrastructure/quote.entity";

function toItem(item: QuoteItemEntity): QuoteItem {
  return {
    id: item.id,
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    purchasePrice: item.purchasePrice,
    salePrice: item.salePrice,
    lineCost: item.lineCost,
    lineSale: item.lineSale,
    lineProfit: item.lineProfit,
    marginPct: item.marginPct,
  };
}

/** Converte a entidade de orçamento para a resposta da API. */
export function toQuote(quote: QuoteEntity): Quote {
  const items = [...(quote.items ?? [])].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1,
  );
  return {
    id: quote.id,
    companyId: quote.companyId,
    number: quote.number,
    customerId: quote.customerId,
    customer: quote.customer
      ? { id: quote.customer.id, name: quote.customer.name }
      : undefined,
    eventId: quote.eventId,
    status: quote.status,
    validUntil: quote.validUntil,
    notes: quote.notes,
    totalCost: quote.totalCost,
    totalSale: quote.totalSale,
    totalProfit: quote.totalProfit,
    marginPct: quote.marginPct,
    items: items.map(toItem),
    createdAt:
      quote.createdAt instanceof Date
        ? quote.createdAt.toISOString()
        : quote.createdAt,
    updatedAt:
      quote.updatedAt instanceof Date
        ? quote.updatedAt.toISOString()
        : quote.updatedAt,
  };
}
