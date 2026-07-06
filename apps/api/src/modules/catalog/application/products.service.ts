import { Injectable } from "@nestjs/common";
import type { Paginated, ProductInput, ProductQuery } from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { CategoryRepository } from "../infrastructure/category.repository";
import { ProductEntity } from "../infrastructure/product.entity";
import { ProductRepository } from "../infrastructure/product.repository";

@Injectable()
export class ProductsService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
  ) {}

  list(query: ProductQuery): Promise<Paginated<ProductEntity>> {
    return this.products.search(query);
  }

  findOne(id: string): Promise<ProductEntity> {
    return this.products.findByIdOrFail(id, ["category"]);
  }

  async create(input: ProductInput): Promise<ProductEntity> {
    // Garante que a categoria pertence ao tenant (findByIdOrFail é escopado).
    await this.categories.findByIdOrFail(input.categoryId);
    return this.products.save(
      this.products.create(this.withDerivedCost(input)),
    );
  }

  async update(id: string, input: ProductInput): Promise<ProductEntity> {
    const product = await this.products.findByIdOrFail(id);
    await this.categories.findByIdOrFail(input.categoryId);
    Object.assign(product, this.withDerivedCost(input));
    return this.products.save(product);
  }

  /**
   * Sem custo informado, deriva o custo por unidade-base do preço de compra
   * padrão (preço do pacote ÷ conteúdo) — mantém a revenda 1:1 correta até a
   * primeira compra atualizar o custo pela última compra.
   */
  private withDerivedCost(input: ProductInput): ProductInput {
    if (input.currentUnitCost > 0) return input;
    const packSize = input.packSize > 0 ? input.packSize : 1;
    return {
      ...input,
      currentUnitCost: roundMoney(input.defaultPurchasePrice / packSize),
    };
  }

  remove(id: string): Promise<void> {
    return this.products.deleteById(id);
  }
}
