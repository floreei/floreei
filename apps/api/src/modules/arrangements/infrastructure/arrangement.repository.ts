import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ArrangementQuery, Paginated } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ArrangementEntity } from "./arrangement.entity";

@Injectable()
export class ArrangementRepository extends TenantScopedRepository<ArrangementEntity> {
  constructor(
    @InjectRepository(ArrangementEntity) repo: Repository<ArrangementEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Buquê");
  }

  /** Lista paginada com categoria + ficha técnica (para calcular o custo). */
  async search(query: ArrangementQuery): Promise<Paginated<ArrangementEntity>> {
    const qb = this.qb("arrangement")
      .leftJoinAndSelect("arrangement.category", "category")
      .leftJoinAndSelect("arrangement.items", "item")
      .leftJoinAndSelect("item.product", "product")
      .orderBy("arrangement.name", "ASC");

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
