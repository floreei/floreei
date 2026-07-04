import { Injectable } from "@nestjs/common";
import type { Paginated, ProductInput, ProductQuery } from "@sistema-flores/types";
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
    return this.products.save(this.products.create(input));
  }

  async update(id: string, input: ProductInput): Promise<ProductEntity> {
    const product = await this.products.findByIdOrFail(id);
    await this.categories.findByIdOrFail(input.categoryId);
    Object.assign(product, input);
    return this.products.save(product);
  }

  remove(id: string): Promise<void> {
    return this.products.deleteById(id);
  }
}
