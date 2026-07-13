import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Paginated, PurchaseQuery } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { applySort } from "../../../common/database/sort";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { PurchaseEntity } from "./purchase.entity";

const SORT: Record<string, string> = {
  date: "purchase.date",
  status: "purchase.status",
  supplier: "supplier.name",
  total: "purchase.total",
  paid: "purchase.paid_amount",
};

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
    const qb = this.qb("purchase").leftJoinAndSelect(
      "purchase.supplier",
      "supplier",
    );
    if (query.sort === "balance") {
      // Saldo é calculado (total - pago): ordena por um select aliasado — o
      // TypeORM não aceita expressão crua com parênteses em orderBy (paginação
      // com join tenta interpretá-la como "alias.coluna").
      qb.addSelect("(purchase.total - purchase.paid_amount)", "balance_calc");
      qb.orderBy("balance_calc", query.order === "asc" ? "ASC" : "DESC");
    } else {
      applySort(qb, query.sort, query.order, SORT, {
        column: "purchase.date",
        direction: "DESC",
      });
    }

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
    if (query.from) {
      qb.andWhere("purchase.date >= :from", { from: query.from });
    }
    if (query.to) {
      qb.andWhere("purchase.date <= :to", { to: query.to });
    }
    if (query.search) {
      qb.andWhere("supplier.name ILIKE :s", { s: `%${query.search}%` });
    }

    return paginate(qb, query.page, query.pageSize);
  }
}
