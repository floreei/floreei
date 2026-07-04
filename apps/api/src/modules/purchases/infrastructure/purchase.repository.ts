import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Paginated, PurchaseQuery } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { PurchaseEntity } from "./purchase.entity";

@Injectable()
export class PurchaseRepository extends TenantScopedRepository<PurchaseEntity> {
  constructor(
    @InjectRepository(PurchaseEntity) repo: Repository<PurchaseEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Compra");
  }

  findDetailed(id: string): Promise<PurchaseEntity | null> {
    return this.findById(id, ["supplier"]);
  }

  async search(query: PurchaseQuery): Promise<Paginated<PurchaseEntity>> {
    const qb = this.qb("purchase")
      .leftJoinAndSelect("purchase.supplier", "supplier")
      .orderBy("purchase.date", "DESC")
      .addOrderBy("purchase.createdAt", "DESC");

    if (query.supplierId) {
      qb.andWhere("purchase.supplier_id = :supplierId", {
        supplierId: query.supplierId,
      });
    }
    if (query.status) {
      qb.andWhere("purchase.status = :status", { status: query.status });
    }
    if (query.unpaidOnly) {
      qb.andWhere("purchase.total > purchase.paid_amount");
      qb.andWhere("purchase.status <> 'CANCELED'");
    }
    if (query.search) {
      qb.andWhere("supplier.name ILIKE :s", { s: `%${query.search}%` });
    }

    return paginate(qb, query.page, query.pageSize);
  }
}
