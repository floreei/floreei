import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  Paginated,
  Quote,
  QuoteInput,
  QuoteItemInput,
  QuoteQuery,
  QuoteStatus,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { CustomerRepository } from "../../customers/infrastructure/customer.repository";
import {
  calculateItem,
  calculateQuote,
} from "../domain/quote-calculator";
import { QuoteItemEntity } from "../infrastructure/quote-item.entity";
import { QuoteRepository } from "../infrastructure/quote.repository";
import { toQuote } from "./quote.mapper";

@Injectable()
export class QuotesService {
  constructor(
    private readonly quotes: QuoteRepository,
    private readonly customers: CustomerRepository,
    private readonly tenant: TenantContextService,
    @InjectRepository(QuoteItemEntity)
    private readonly items: Repository<QuoteItemEntity>,
  ) {}

  async list(query: QuoteQuery): Promise<Paginated<Quote>> {
    const page = await this.quotes.search(query);
    return { ...page, data: page.data.map(toQuote) };
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quotes.findByIdOrFail(id, ["customer"]);
    return toQuote(quote);
  }

  async create(input: QuoteInput): Promise<Quote> {
    await this.customers.findByIdOrFail(input.customerId);
    const number = await this.quotes.nextNumber();
    const totals = calculateQuote(input.items);

    const quote = this.quotes.create({
      number,
      customerId: input.customerId,
      status: "DRAFT",
      validUntil: input.validUntil ?? null,
      notes: input.notes ?? null,
      createdById: this.tenant.get()?.userId ?? null,
      items: this.buildItems(input.items),
      ...totals,
    });

    const saved = await this.quotes.save(quote);
    return this.findOne(saved.id);
  }

  /** Cria um novo orçamento (rascunho) copiando cliente e itens de outro. */
  async duplicate(id: string): Promise<Quote> {
    const source = await this.quotes.findByIdOrFail(id);
    const items: QuoteItemInput[] = (source.items ?? []).map((item) => ({
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
    }));

    return this.create({
      customerId: source.customerId,
      notes: source.notes ?? undefined,
      items,
    });
  }

  async update(id: string, input: QuoteInput): Promise<Quote> {
    const quote = await this.quotes.findByIdOrFail(id);
    this.ensureEditable(quote.status);

    if (input.customerId !== quote.customerId) {
      await this.customers.findByIdOrFail(input.customerId);
    }

    // Substitui os itens: remove os antigos e insere os novos.
    await this.items.delete({ quoteId: id });
    const newItems = this.buildItems(input.items).map((item) => {
      item.quoteId = id;
      return item;
    });
    if (newItems.length > 0) {
      await this.items.save(newItems);
    }

    await this.quotes.updateById(id, {
      customerId: input.customerId,
      validUntil: input.validUntil ?? null,
      notes: input.notes ?? null,
      ...calculateQuote(input.items),
    });

    return this.findOne(id);
  }

  async changeStatus(id: string, status: QuoteStatus): Promise<Quote> {
    const quote = await this.quotes.findByIdOrFail(id);
    if (quote.status === "APPROVED") {
      throw new BadRequestException(
        "Um orçamento aprovado não pode mudar de status.",
      );
    }
    if (status === "APPROVED") {
      throw new BadRequestException(
        "Para aprovar, converta o orçamento em evento.",
      );
    }
    quote.status = status;
    await this.quotes.save(quote);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const quote = await this.quotes.findByIdOrFail(id);
    if (quote.eventId) {
      throw new BadRequestException(
        "Orçamento já convertido em evento não pode ser excluído.",
      );
    }
    await this.quotes.deleteById(id);
  }

  private ensureEditable(status: QuoteStatus): void {
    if (status === "APPROVED") {
      throw new BadRequestException(
        "Um orçamento aprovado não pode mais ser editado.",
      );
    }
  }

  private buildItems(inputs: QuoteItemInput[]): QuoteItemEntity[] {
    return inputs.map((input) => {
      const totals = calculateItem(input);
      const item = new QuoteItemEntity();
      Object.assign(item, {
        productId: input.productId ?? null,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        ...totals,
      });
      return item;
    });
  }
}
