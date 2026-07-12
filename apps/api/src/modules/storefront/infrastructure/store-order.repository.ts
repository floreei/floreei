import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Paginated, StoreOrderQuery } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { applySort } from "../../../common/database/sort";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { StoreOrderEntity } from "./store-order.entity";

const SORT: Record<string, string> = {
  date: "order.createdAt",
  status: "order.status",
  customer: "order.customerName",
};

@Injectable()
export class StoreOrderRepository extends TenantScopedRepository<StoreOrderEntity> {
  constructor(
    @InjectRepository(StoreOrderEntity) repo: Repository<StoreOrderEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Pedido da loja");
  }

  /** Lista paginada com busca (cliente), status e período (data do pedido). */
  async search(query: StoreOrderQuery): Promise<Paginated<StoreOrderEntity>> {
    const qb = this.qb("order");
    applySort(qb, query.sort, query.order, SORT, {
      column: "order.createdAt",
      direction: "DESC",
    });

    if (query.status) {
      qb.andWhere("order.status = :status", { status: query.status });
    }
    if (query.from) {
      qb.andWhere("DATE(order.created_at) >= :from", { from: query.from });
    }
    if (query.to) {
      qb.andWhere("DATE(order.created_at) <= :to", { to: query.to });
    }
    if (query.search) {
      qb.andWhere(
        "(order.customer_name ILIKE :s OR order.customer_phone ILIKE :s)",
        { s: `%${query.search}%` },
      );
    }

    return paginate(qb, query.page, query.pageSize);
  }
}
