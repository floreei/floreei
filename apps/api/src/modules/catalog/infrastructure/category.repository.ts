import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { CategoryEntity } from "./category.entity";

@Injectable()
export class CategoryRepository extends TenantScopedRepository<CategoryEntity> {
  constructor(
    @InjectRepository(CategoryEntity) repo: Repository<CategoryEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Categoria");
  }

  /** Lista as categorias com a contagem de produtos de cada uma. */
  async listWithCounts(): Promise<Array<CategoryEntity & { productCount: number }>> {
    const rows = await this.qb("category")
      .loadRelationCountAndMap("category.productCount", "category.products")
      .orderBy("category.name", "ASC")
      .getMany();
    return rows as Array<CategoryEntity & { productCount: number }>;
  }

  findByName(name: string): Promise<CategoryEntity | null> {
    return this.findOneBy({ name });
  }
}
