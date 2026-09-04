import type { Event, EventItem } from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { EventEntity } from "../infrastructure/event.entity";
import { EventItemEntity } from "../infrastructure/event-item.entity";

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

function toItem(item: EventItemEntity): EventItem {
  const unitCost = item.unitCost ?? null;
  const lineCost = unitCost === null ? null : roundMoney(item.quantity * unitCost);
  const lineProfit = lineCost === null ? null : roundMoney(item.lineTotal - lineCost);
  const profitShares = item.profitShares ?? 1;
  const myLineProfit = lineProfit === null ? null : roundMoney(lineProfit / profitShares);
  return {
    id: item.id,
    productId: item.productId,
    arrangementId: item.arrangementId,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitSalePrice: item.unitSalePrice,
    lineTotal: item.lineTotal,
    unitCost,
    lineCost,
    lineProfit,
    profitShares,
    myLineProfit,
    partnersLineShare: lineProfit === null ? null : roundMoney(lineProfit - (myLineProfit as number)),
  };
}

/** Converte a entidade de evento para a resposta da API. */
export function toEvent(event: EventEntity): Event {
  const items = [...(event.items ?? [])].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1,
  );
  return {
    id: event.id,
    companyId: event.companyId,
    type: event.type,
    channel: event.channel,
    customerId: event.customerId,
    customer: event.customer
      ? { id: event.customer.id, name: event.customer.name }
      : undefined,
    quoteId: event.quoteId,
    responsibleUserId: event.responsibleUserId,
    title: event.title,
    date: event.date,
    deliveryDate: event.deliveryDate ?? null,
    dueDate: event.dueDate ?? null,
    location: event.location,
    status: event.status,
    soldValue: event.soldValue,
    cost: event.cost,
    receivedValue: event.receivedValue,
    estimatedProfit: event.estimatedProfit,
    partnersShare: event.partnersShare ?? 0,
    myProfit: roundMoney(event.estimatedProfit - (event.partnersShare ?? 0)),
    realProfit: event.realProfit,
    notes: event.notes,
    items: items.map(toItem),
    createdAt: iso(event.createdAt),
    updatedAt: iso(event.updatedAt),
  };
}
