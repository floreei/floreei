import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { StoreOrderEntity } from "./store-order.entity";

@Injectable()
export class StoreOrderRepository extends TenantScopedRepository<StoreOrderEntity> {
  constructor(
    @InjectRepository(StoreOrderEntity) repo: Repository<StoreOrderEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Pedido da loja");
  }

  /** Lista os pedidos da empresa (mais recentes primeiro). */
  list(): Promise<StoreOrderEntity[]> {
    return this.qb("order").orderBy("order.created_at", "DESC").getMany();
  }
}
