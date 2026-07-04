import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Paginated, ProductQuery } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ProductEntity } from "./product.entity";

@Injectable()
export class ProductRepository extends TenantScopedRepository<ProductEntity> {
  constructor(
    @InjectRepository(ProductEntity) repo: Repository<ProductEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Produto");
  }

  /** Lista paginada de produtos com categoria, busca e filtros. */
  async search(query: ProductQuery): Promise<Paginated<ProductEntity>> {
    const qb = this.qb("product")
      .leftJoinAndSelect("product.category", "category")
      .orderBy("product.name", "ASC");

    if (query.search) {
      qb.andWhere("product.name ILIKE :s", { s: `%${query.search}%` });
    }
    if (query.categoryId) {
      qb.andWhere("product.category_id = :categoryId", {
        categoryId: query.categoryId,
      });
    }
    if (query.onlyActive) {
      qb.andWhere("product.active = true");
    }

    return paginate(qb, query.page, query.pageSize);
  }

  countByCategory(categoryId: string): Promise<number> {
    return this.count({ categoryId });
  }
}
