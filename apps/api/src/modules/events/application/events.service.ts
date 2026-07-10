import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  AttachmentInput,
  ConvertQuoteInput,
  EditSaleItemsInput,
  Event,
  EventAttachment,
  EventInput,
  EventQuery,
  EventUpdate,
  Invoice,
  Paginated,
  QuickSaleInput,
  QuickSaleItem,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { todayISO } from "../../../common/date/today";
import { roundMoney } from "../../../common/money/money";
import { ArrangementsService } from "../../arrangements/application/arrangements.service";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { CompanyService } from "../../companies/company.module";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import type { NfeItemData } from "../../invoices/application/ports/nfe-provider.port";
import { InvoicesService } from "../../invoices/application/invoices.service";
import { QuoteRepository } from "../../quotes/infrastructure/quote.repository";
import { StockService } from "../../stock/application/stock.service";
import { EventAttachmentEntity } from "../infrastructure/event-attachment.entity";
import { EventAttachmentRepository } from "../infrastructure/event-attachment.repository";
import { EventItemEntity } from "../infrastructure/event-item.entity";
import { EventRepository } from "../infrastructure/event.repository";
import { toEvent } from "./event.mapper";

/** Arredonda quantidade para 3 casas (unidade-base pode ser fracionada). */
function roundQty(n: number): number {
  return Math.round(n * 1000) / 1000;
}

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
    private readonly arrangements: ArrangementsService,
    private readonly invoices: InvoicesService,
    private readonly companies: CompanyService,
    @InjectRepository(EventItemEntity)
    private readonly items: Repository<EventItemEntity>,
  ) {}

  /**
   * Processa os itens de uma venda: monta as linhas (`event_items`), o consumo de
   * estoque (buquê explode a ficha técnica em insumos) e as somas de venda e custo.
   * Custo = `currentUnitCost` do insumo × qtd, ou `arrangement.cost` × qtd (buquê).
   */
  private async processSaleItems(items: QuickSaleItem[]): Promise<{
    itemEntities: EventItemEntity[];
    consumption: { productId: string; quantity: number }[];
    saleSum: number;
    costSum: number;
  }> {
    const itemEntities: EventItemEntity[] = [];
    const consumption: { productId: string; quantity: number }[] = [];
    let saleAcc = 0;
    let costAcc = 0;

    for (const item of items) {
      const ei = new EventItemEntity();
      if (item.arrangementId) {
        const arr = await this.arrangements.findOne(item.arrangementId);
        const unitSale = item.unitSalePrice ?? arr.salePrice;
        saleAcc += item.quantity * unitSale;
        costAcc += item.quantity * arr.cost;
        for (const comp of arr.items) {
          consumption.push({
            productId: comp.productId,
            quantity: roundQty(item.quantity * comp.quantity),
          });
        }
        Object.assign(ei, {
          productId: null,
          arrangementId: arr.id,
          description: arr.name,
          quantity: item.quantity,
          unit: "UNIDADE",
          unitSalePrice: roundMoney(unitSale),
          lineTotal: roundMoney(item.quantity * unitSale),
        });
      } else {
        const product = await this.products.findByIdOrFail(
          item.productId as string,
        );
        // A linha pode estar em maço (unidade de compra) ou na unidade-base
        // (haste). Estoque e custo são sempre pela base; a receita, pela unidade
        // escolhida. Preço por haste sugerido = preço do maço ÷ packSize.
        const pack =
          product.packSize > 1 && item.saleUnit === product.purchaseUnit;
        const baseQty = pack
          ? roundQty(item.quantity * product.packSize)
          : item.quantity;
        const perUnitDefault =
          pack || product.packSize <= 1
            ? product.defaultSalePrice
            : roundMoney(product.defaultSalePrice / product.packSize);
        const unitSale = item.unitSalePrice ?? perUnitDefault;
        saleAcc += item.quantity * unitSale;
        costAcc += baseQty * product.currentUnitCost;
        consumption.push({ productId: product.id, quantity: baseQty });
        Object.assign(ei, {
          productId: product.id,
          arrangementId: null,
          description: product.name,
          quantity: item.quantity,
          unit: item.saleUnit ?? product.unit,
          unitSalePrice: roundMoney(unitSale),
          lineTotal: roundMoney(item.quantity * unitSale),
        });
      }
      itemEntities.push(ei);
    }

    return {
      itemEntities,
      consumption,
      saleSum: roundMoney(saleAcc),
      costSum: roundMoney(costAcc),
    };
  }

  /**
   * Venda de balcão: insumos avulsos (revenda), buquês (produto composto) ou
   * valor livre. Custo = `currentUnitCost` do insumo × qtd, ou `arrangement.cost`
   * × qtd para buquês. Buquê explode a ficha técnica em baixa de estoque.
   */
  async quickSale(input: QuickSaleInput): Promise<Event> {
    if (input.customerId) {
      await this.customers.findByIdOrFail(input.customerId);
    }

    const date = input.date ?? todayISO();

    let soldValue = roundMoney(input.amount ?? 0);
    let cost = 0;
    let estimatedProfit = 0;
    const items = input.items ?? [];
    let itemEntities: EventItemEntity[] = [];
    let consumption: { productId: string; quantity: number }[] = [];

    if (items.length > 0) {
      const processed = await this.processSaleItems(items);
      itemEntities = processed.itemEntities;
      consumption = processed.consumption;
      soldValue = processed.saleSum;
      cost = processed.costSum;
      estimatedProfit = roundMoney(soldValue - cost);
    }

    const event = this.events.create({
      type: "ORDER",
      channel: input.channel ?? "RETAIL",
      customerId: input.customerId ?? null,
      title: input.title?.trim() || "Venda de balcão",
      date,
      deliveryDate: input.deliveryDate ?? null,
      status: "CONFIRMED",
      soldValue,
      cost,
      estimatedProfit,
      receivedValue: 0,
      items: itemEntities,
    });
    const saved = await this.events.save(event);

    if (consumption.length > 0) {
      await this.stock.registerFromEvent(saved.id, date, consumption);
    }

    // Emissão automática: aguardamos (não fire-and-forget) porque a API roda
    // no Cloud Run — o container pode ser encerrado logo após a resposta,
    // sem garantir que uma promise não aguardada termine. InvoicesService
    // nunca propaga erro (vira REJECTED tratado), então isso nunca derruba
    // a venda mesmo se o provedor real falhar.
    if (await this.companies.isInvoiceAutoEmitEnabled()) {
      await this.emitInvoice(saved.id).catch(() => undefined);
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

  /**
   * Substitui os itens de uma venda e reprocessa estoque, custo e o total. Os itens
   * sempre governam estoque + custo; `pricingMode` decide a receita (soma dos itens
   * ou valor fixo informado). Serve também para detalhar vendas avulsas antigas.
   */
  async editItems(id: string, input: EditSaleItemsInput): Promise<Event> {
    const event = await this.events.findByIdOrFail(id);
    if (event.status === "CANCELED") {
      throw new BadRequestException("Uma venda cancelada não pode ser editada.");
    }

    const { itemEntities, consumption, saleSum, costSum } =
      await this.processSaleItems(input.items);

    // Troca as linhas da venda.
    await this.items.delete({ eventId: id });
    for (const ei of itemEntities) ei.eventId = id;
    await this.items.save(itemEntities);

    // Reprocessa o estoque (delete+recreate — idempotente em edições repetidas).
    await this.stock.clearForEvent(id);
    await this.stock.registerFromEvent(id, event.date, consumption);

    const soldValue =
      input.pricingMode === "ITEMS"
        ? saleSum
        : roundMoney(input.soldValue ?? 0);
    await this.events.updateById(id, {
      soldValue,
      cost: costSum,
      estimatedProfit: roundMoney(soldValue - costSum),
    });
    return this.findOne(id);
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
      // COGS de um evento manual = venda − lucro informado.
      cost: roundMoney((input.soldValue ?? 0) - (input.estimatedProfit ?? 0)),
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
    // Mantém o COGS coerente com venda − lucro.
    event.cost = roundMoney(event.soldValue - event.estimatedProfit);
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
      // COGS da revenda = custo manual do orçamento (venda − lucro).
      cost: roundMoney(quote.totalSale - quote.totalProfit),
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
    if (await this.invoices.hasAny(id)) {
      throw new BadRequestException(
        "Não é possível excluir uma venda com nota fiscal emitida ou tentada. Cancele a nota antes.",
      );
    }
    // Desvincula orçamentos apontando para este evento antes de remover.
    if (event.quoteId) {
      await this.quotes.updateById(event.quoteId, { eventId: null });
    }
    await this.events.deleteById(id);
  }

  /** Monta a requisição de emissão a partir da venda e dispara. */
  async emitInvoice(id: string): Promise<Invoice> {
    const event = await this.events.findByIdOrFail(id, [
      "customer",
      "items",
      "items.product",
    ]);
    const company = await this.companies.getCurrentEntity();

    const items: NfeItemData[] =
      event.items.length > 0
        ? event.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitSalePrice,
            ncm: i.product?.ncm ?? null,
          }))
        : [
            {
              description: event.title,
              quantity: 1,
              unitPrice: event.soldValue,
              ncm: null,
            },
          ];

    return this.invoices.emit({
      eventId: event.id,
      channel: event.channel,
      issuer: {
        companyId: company.id,
        name: company.name,
        document: company.document,
        stateRegistration: company.stateRegistration,
        taxRegime: company.taxRegime,
        address: {
          street: company.fiscalAddressStreet,
          number: company.fiscalAddressNumber,
          complement: company.fiscalAddressComplement,
          neighborhood: company.fiscalAddressNeighborhood,
          city: company.fiscalAddressCity,
          state: company.fiscalAddressState,
          zip: company.fiscalAddressZip,
          cityCode: company.fiscalCityCode,
        },
      },
      recipient: event.customer
        ? {
            name: event.customer.name,
            document: event.customer.document,
            email: event.customer.email,
            address: event.customer.address,
          }
        : null,
      items,
      totalValue: event.soldValue,
    });
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    await this.events.findByIdOrFail(id);
    return this.invoices.latestForEvent(id);
  }

  async getInvoiceHistory(id: string): Promise<Invoice[]> {
    await this.events.findByIdOrFail(id);
    return this.invoices.historyForEvent(id);
  }

  async cancelInvoice(id: string, reason: string): Promise<Invoice> {
    await this.events.findByIdOrFail(id);
    const current = await this.invoices.latestForEvent(id);
    if (!current) {
      throw new BadRequestException("Esta venda não tem nota fiscal emitida.");
    }
    return this.invoices.cancel(current.id, reason);
  }
}
