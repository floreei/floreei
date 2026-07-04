import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  AttachmentInput,
  ConvertQuoteInput,
  Event,
  EventAttachment,
  EventInput,
  EventQuery,
  EventUpdate,
  Paginated,
  QuickSaleInput,
} from "@sistema-flores/types";
import { todayISO } from "../../../common/date/today";
import { roundMoney } from "../../../common/money/money";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import { QuoteRepository } from "../../quotes/infrastructure/quote.repository";
import { StockService } from "../../stock/application/stock.service";
import { EventAttachmentEntity } from "../infrastructure/event-attachment.entity";
import { EventAttachmentRepository } from "../infrastructure/event-attachment.repository";
import { EventItemEntity } from "../infrastructure/event-item.entity";
import { EventRepository } from "../infrastructure/event.repository";
import { toEvent } from "./event.mapper";

function toAttachment(a: EventAttachmentEntity): EventAttachment {
  return {
    id: a.id,
    eventId: a.eventId,
    label: a.label,
    url: a.url,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
  };
}

@Injectable()
export class EventsService {
  constructor(
    private readonly events: EventRepository,
    private readonly customers: CustomerRepository,
    private readonly quotes: QuoteRepository,
    private readonly stock: StockService,
    private readonly attachments: EventAttachmentRepository,
    private readonly products: ProductRepository,
  ) {}

  /** Venda rápida de balcão: produtos do catálogo ou valor livre. */
  async quickSale(input: QuickSaleInput): Promise<Event> {
    if (input.customerId) {
      await this.customers.findByIdOrFail(input.customerId);
    }

    const date = input.date ?? todayISO();

    let soldValue = roundMoney(input.amount ?? 0);
    let estimatedProfit = 0;
    const items = input.items ?? [];
    const itemEntities: EventItemEntity[] = [];

    if (items.length > 0) {
      let cost = 0;
      let sale = 0;
      for (const item of items) {
        const product = await this.products.findByIdOrFail(item.productId);
        // Preço de venda pode variar por venda; custo segue o padrão do catálogo.
        const unitSale = item.unitSalePrice ?? product.defaultSalePrice;
        sale += item.quantity * unitSale;
        cost += item.quantity * product.defaultPurchasePrice;
        const ei = new EventItemEntity();
        Object.assign(ei, {
          productId: item.productId,
          description: product.name,
          quantity: item.quantity,
          unit: product.unit,
          unitSalePrice: roundMoney(unitSale),
          lineTotal: roundMoney(item.quantity * unitSale),
        });
        itemEntities.push(ei);
      }
      soldValue = roundMoney(sale);
      estimatedProfit = roundMoney(sale - cost);
    }

    const event = this.events.create({
      type: "ORDER",
      customerId: input.customerId ?? null,
      title: input.title?.trim() || "Venda de balcão",
      date,
      status: "CONFIRMED",
      soldValue,
      estimatedProfit,
      receivedValue: 0,
      items: itemEntities,
    });
    const saved = await this.events.save(event);

    if (items.length > 0) {
      await this.stock.registerFromEvent(
        saved.id,
        date,
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      );
    }

    return this.findOne(saved.id);
  }

  async listAttachments(eventId: string): Promise<EventAttachment[]> {
    await this.events.findByIdOrFail(eventId);
    return (await this.attachments.listForEvent(eventId)).map(toAttachment);
  }

  async addAttachment(
    eventId: string,
    input: AttachmentInput,
  ): Promise<EventAttachment> {
    await this.events.findByIdOrFail(eventId);
    const attachment = this.attachments.create({ eventId, ...input });
    return toAttachment(await this.attachments.save(attachment));
  }

  removeAttachment(id: string): Promise<void> {
    return this.attachments.deleteById(id);
  }

  async list(query: EventQuery): Promise<Paginated<Event>> {
    const page = await this.events.search(query);
    return { ...page, data: page.data.map(toEvent) };
  }

  async findOne(id: string): Promise<Event> {
    return toEvent(await this.events.findByIdOrFail(id, ["customer", "items"]));
  }

  async create(input: EventInput): Promise<Event> {
    if (input.customerId) {
      await this.customers.findByIdOrFail(input.customerId);
    }
    const event = this.events.create({
      ...input,
      customerId: input.customerId ?? null,
      location: input.location ?? null,
      responsibleUserId: input.responsibleUserId ?? null,
      notes: input.notes ?? null,
    });
    const saved = await this.events.save(event);
    return this.findOne(saved.id);
  }

  async update(id: string, input: EventUpdate): Promise<Event> {
    const event = await this.events.findByIdOrFail(id);
    if (input.customerId && input.customerId !== event.customerId) {
      await this.customers.findByIdOrFail(input.customerId);
    }
    Object.assign(event, input);
    await this.events.save(event);
    return this.findOne(id);
  }

  /** Converte um orçamento aprovado em evento (venda confirmada). */
  async convertFromQuote(
    quoteId: string,
    input: ConvertQuoteInput,
  ): Promise<Event> {
    const quote = await this.quotes.findByIdOrFail(quoteId);
    if (quote.eventId || quote.status === "APPROVED") {
      throw new BadRequestException("Este orçamento já foi convertido.");
    }
    if (quote.status === "REJECTED" || quote.status === "EXPIRED") {
      throw new BadRequestException(
        "Apenas orçamentos em aberto podem ser convertidos.",
      );
    }

    const itemEntities = (quote.items ?? []).map((item) => {
      const ei = new EventItemEntity();
      Object.assign(ei, {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitSalePrice: item.salePrice,
        lineTotal: roundMoney(item.quantity * item.salePrice),
      });
      return ei;
    });

    const event = this.events.create({
      type: "EVENT",
      customerId: quote.customerId,
      quoteId: quote.id,
      title: input.title,
      date: input.date,
      location: input.location ?? null,
      responsibleUserId: input.responsibleUserId ?? null,
      status: "CONFIRMED",
      soldValue: quote.totalSale,
      estimatedProfit: quote.totalProfit,
      receivedValue: 0,
      items: itemEntities,
    });
    const saved = await this.events.save(event);

    await this.quotes.updateById(quote.id, {
      status: "APPROVED",
      eventId: saved.id,
    });

    // Baixa do estoque dos insumos usados no evento.
    await this.stock.registerFromEvent(
      saved.id,
      input.date,
      (quote.items ?? []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    );

    return this.findOne(saved.id);
  }

  /** Cancela um evento e devolve os insumos usados ao estoque. */
  async cancel(id: string): Promise<Event> {
    const event = await this.events.findByIdOrFail(id);
    if (event.status === "CANCELED") {
      throw new BadRequestException("Este evento já está cancelado.");
    }
    await this.stock.reverseEvent(id);
    await this.events.updateById(id, { status: "CANCELED" });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const event = await this.events.findByIdOrFail(id);
    // Desvincula orçamentos apontando para este evento antes de remover.
    if (event.quoteId) {
      await this.quotes.updateById(event.quoteId, { eventId: null });
    }
    await this.events.deleteById(id);
  }
}
