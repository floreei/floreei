import { Injectable } from "@nestjs/common";
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
} from "typeorm";
import { TenantOwnedEntity } from "../database/tenant-owned.entity";
import { TenantContextService } from "./tenant-context.service";

/**
 * Preenche `companyId` automaticamente ao inserir qualquer entidade do tenant,
 * usando o contexto da requisição. É a rede de segurança que garante que nenhum
 * registro seja criado sem dono — mesmo que o service esqueça de setar.
 */
@Injectable()
export class TenantSubscriber implements EntitySubscriberInterface {
  constructor(
    dataSource: DataSource,
    private readonly tenant: TenantContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  beforeInsert(event: InsertEvent<unknown>): void {
    const entity = event.entity;
    if (!(entity instanceof TenantOwnedEntity)) return;

    if (!entity.companyId) {
      const companyId = this.tenant.getCompanyId();
      if (companyId) {
        entity.companyId = companyId;
      }
    }
  }
}
