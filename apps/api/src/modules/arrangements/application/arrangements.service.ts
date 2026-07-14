import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  Arrangement,
  ArrangementInput,
  ArrangementItemInput,
  ArrangementQuery,
  Paginated,
} from "@sistema-flores/types";
import {
  arrangementSalePrice,
  invalidQuantityForUnit,
  roundMoney,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { CategoryRepository } from "../../catalog/infrastructure/category.repository";
import { ProductRepository } from "../../catalog/infrastructure/product.repository";
import { StockService } from "../../stock/application/stock.service";
import { ArrangementItemEntity } from "../infrastructure/arrangement-item.entity";
import { ArrangementRepository } from "../infrastructure/arrangement.repository";
import { toArrangement } from "./arrangement.mapper";

/** Arredonda quantidade para 3 casas (unidade-base pode ser fracionada). */
function roundQty(n: number): number {
  return Math.round(n * 1000) / 1000;
}

@Injectable()
export class ArrangementsService {
  constructor(
    private readonly arrangements: ArrangementRepository,
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly stock: StockService,
    @InjectRepository(ArrangementItemEntity)
    private readonly items: Repository<ArrangementItemEntity>,
  ) {}

  async list(query: ArrangementQuery): Promise<Paginated<Arrangement>> {
    const page = await this.arrangements.search(query);
    return { ...page, data: page.data.map(toArrangement) };
  }

  async findOne(id: string): Promise<Arrangement> {
    return toArrangement(
      await this.arrangements.findByIdOrFail(id, [
        "category",
        "items",
        "items.product",
      ]),
    );
  }

  async create(input: ArrangementInput): Promise<Arrangement> {
    await this.validate(input);
    const arrangement = this.arrangements.create({
      categoryId: input.categoryId ?? null,
      name: input.name,
      pricingMode: input.pricingMode,
      salePrice: await this.effectivePrice(input),
      profitValue: input.profitValue,
      profitPct: input.profitPct,
      active: input.active,
      imageUrl: input.imageUrl ?? null,
      storePublished: input.storePublished,
      description: input.description ?? null,
      badge: input.badge ?? null,
      storeCategory: input.storeCategory ?? null,
      storeSizes: input.storeSizes,
      items: this.buildItems(input.items),
    });
    const saved = await this.arrangements.save(arrangement);
    if (input.produce && input.produce > 0) {
      await this.produce(saved.id, input.produce);
    }
    return this.findOne(saved.id);
  }

  /** Custo atual da ficha técnica (Σ quantidade × custo por unidade-base). */
  private async costOf(items: ArrangementItemInput[]): Promise<number> {
    let cost = 0;
    for (const item of items) {
      const product = await this.products.findByIdOrFail(item.productId);
      cost += item.quantity * product.currentUnitCost;
    }
    return roundMoney(cost);
  }

  /** Preço efetivo a gravar conforme a política (FIXED / lucro R$ / margem %). */
  private async effectivePrice(input: ArrangementInput): Promise<number> {
    return arrangementSalePrice(await this.costOf(input.items), input.pricingMode, {
      salePrice: input.salePrice,
      profitValue: input.profitValue,
      profitPct: input.profitPct,
    });
  }

  /**
   * Registra a **produção** de N buquês: baixa `quantity ×` a ficha técnica do
   * estoque (cada insumo). Não mexe no preço nem cria venda.
   */
  async produce(id: string, quantity: number): Promise<Arrangement> {
    const arr = await this.findOne(id);
    if (quantity > 0) {
      await this.stock.registerProduction(
        arr.items.map((i) => ({
          productId: i.productId,
          quantity: roundQty(i.quantity * quantity),
        })),
        `Produção de ${quantity}× ${arr.name}`,
      );
    }
    return this.findOne(id);
  }

  async update(id: string, input: ArrangementInput): Promise<Arrangement> {
    await this.arrangements.findByIdOrFail(id);
    await this.validate(input);

    await this.items.delete({ arrangementId: id });
    const newItems = this.buildItems(input.items).map((item) => {
      item.arrangementId = id;
      return item;
    });
    await this.items.save(newItems);

    await this.arrangements.updateById(id, {
      categoryId: input.categoryId ?? null,
      name: input.name,
      pricingMode: input.pricingMode,
      salePrice: await this.effectivePrice(input),
      profitValue: input.profitValue,
      profitPct: input.profitPct,
      active: input.active,
      imageUrl: input.imageUrl ?? null,
      storePublished: input.storePublished,
      description: input.description ?? null,
      badge: input.badge ?? null,
      storeCategory: input.storeCategory ?? null,
      storeSizes: input.storeSizes,
    });
    return this.findOne(id);
  }

  remove(id: string): Promise<void> {
    return this.arrangements.deleteById(id);
  }

  /** Garante que categoria e insumos pertencem ao tenant. */
  private async validate(input: ArrangementInput): Promise<void> {
    if (input.categoryId) {
      await this.categories.findByIdOrFail(input.categoryId);
    }
    for (const item of input.items) {
      const product = await this.products.findByIdOrFail(item.productId);
      const error = invalidQuantityForUnit(item.quantity, product.unit);
      if (error) {
        throw new BadRequestException(`${product.name}: ${error}`);
      }
    }
  }

  private buildItems(inputs: ArrangementItemInput[]): ArrangementItemEntity[] {
    return inputs.map((input) => {
      const item = new ArrangementItemEntity();
      item.productId = input.productId;
      item.quantity = input.quantity;
      return item;
    });
  }
}
