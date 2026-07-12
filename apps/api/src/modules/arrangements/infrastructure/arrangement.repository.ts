import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ArrangementQuery, Paginated } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { applySort } from "../../../common/database/sort";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ArrangementEntity } from "./arrangement.entity";

const SORT: Record<string, string> = {
  name: "arrangement.name",
  category: "category.name",
};

@Injectable()
export class ArrangementRepository extends TenantScopedRepository<ArrangementEntity> {
  constructor(
    @InjectRepository(ArrangementEntity) repo: Repository<ArrangementEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Buquê");
  }

  /** Buquês publicados na loja (com categoria), ordenados por categoria/nome. */
  listPublished(): Promise<ArrangementEntity[]> {
    return this.qb("arrangement")
      .leftJoinAndSelect("arrangement.category", "category")
      .andWhere("arrangement.store_published = true")
      .andWhere("arrangement.active = true")
      .orderBy("category.name", "ASC")
      .addOrderBy("arrangement.name", "ASC")
      .getMany();
  }

  /** Um buquê publicado (validação do checkout). */
  findPublishedById(id: string): Promise<ArrangementEntity | null> {
    return this.qb("arrangement")
      .andWhere("arrangement.id = :id", { id })
      .andWhere("arrangement.store_published = true")
      .andWhere("arrangement.active = true")
      .getOne();
  }

  /** Lista paginada com categoria + ficha técnica (para calcular o custo). */
  async search(query: ArrangementQuery): Promise<Paginated<ArrangementEntity>> {
    const qb = this.qb("arrangement")
      .leftJoinAndSelect("arrangement.category", "category")
      .leftJoinAndSelect("arrangement.items", "item")
      .leftJoinAndSelect("item.product", "product");
    applySort(qb, query.sort, query.order, SORT, {
      column: "arrangement.name",
      direction: "ASC",
    });

    if (query.search) {
      qb.andWhere("arrangement.name ILIKE :s", { s: `%${query.search}%` });
    }
    if (query.categoryId) {
      qb.andWhere("arrangement.category_id = :categoryId", {
        categoryId: query.categoryId,
      });
    }
    if (query.onlyActive) {
      qb.andWhere("arrangement.active = true");
    }

    return paginate(qb, query.page, query.pageSize);
  }
}
