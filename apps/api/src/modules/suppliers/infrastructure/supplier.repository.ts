import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Paginated, SupplierQuery } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { applySort } from "../../../common/database/sort";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { SupplierEntity } from "./supplier.entity";

const SORT: Record<string, string> = {
  name: "supplier.name",
  city: "supplier.city",
};

@Injectable()
export class SupplierRepository extends TenantScopedRepository<SupplierEntity> {
  constructor(
    @InjectRepository(SupplierEntity) repo: Repository<SupplierEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Fornecedor");
  }

  async search(query: SupplierQuery): Promise<Paginated<SupplierEntity>> {
    const qb = this.qb("supplier");
    applySort(qb, query.sort, query.order, SORT, {
      column: "supplier.name",
      direction: "ASC",
    });
    if (query.search) {
      qb.andWhere(
        "(supplier.name ILIKE :s OR supplier.city ILIKE :s OR supplier.contact ILIKE :s)",
        { s: `%${query.search}%` },
      );
    }
    return paginate(qb, query.page, query.pageSize);
  }
}
