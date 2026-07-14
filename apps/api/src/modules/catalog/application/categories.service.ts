import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import type { CategoryInput } from "@sistema-flores/types";
import { StoreRevalidationService } from "../../storefront/store-revalidation.service";
import { CategoryEntity } from "../infrastructure/category.entity";
import { CategoryRepository } from "../infrastructure/category.repository";
import { ProductRepository } from "../infrastructure/product.repository";

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
    private readonly revalidation: StoreRevalidationService,
  ) {}

  list() {
    return this.categories.listWithCounts();
  }

  findOne(id: string): Promise<CategoryEntity> {
    return this.categories.findByIdOrFail(id);
  }

  async create(input: CategoryInput): Promise<CategoryEntity> {
    await this.ensureNameAvailable(input.name);
    const saved = await this.categories.save(this.categories.create(input));
    await this.revalidation.revalidateCurrentTenant();
    return saved;
  }

  async update(id: string, input: CategoryInput): Promise<CategoryEntity> {
    const category = await this.categories.findByIdOrFail(id);
    if (input.name !== category.name) {
      await this.ensureNameAvailable(input.name);
    }
    category.name = input.name;
    const saved = await this.categories.save(category);
    await this.revalidation.revalidateCurrentTenant();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const count = await this.products.countByCategory(id);
    if (count > 0) {
      throw new BadRequestException(
        "Não é possível excluir uma categoria com produtos. Mova ou exclua os produtos primeiro.",
      );
    }
    await this.categories.deleteById(id);
    await this.revalidation.revalidateCurrentTenant();
  }

  private async ensureNameAvailable(name: string): Promise<void> {
    if (await this.categories.findByName(name)) {
      throw new ConflictException("Já existe uma categoria com este nome.");
    }
  }
}
