import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { InvoiceEntity } from "./invoice.entity";

@Injectable()
export class InvoiceRepository extends TenantScopedRepository<InvoiceEntity> {
  constructor(
    @InjectRepository(InvoiceEntity) repo: Repository<InvoiceEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Nota fiscal");
  }

  /** Histórico completo de uma venda, mais recente primeiro. */
  listForEvent(eventId: string): Promise<InvoiceEntity[]> {
    return this.findAll({ where: { eventId }, order: { createdAt: "DESC" } });
  }

  async latestForEvent(eventId: string): Promise<InvoiceEntity | null> {
    const [latest] = await this.findAll({
      where: { eventId },
      order: { createdAt: "DESC" },
    });
    return latest ?? null;
  }

  hasAny(eventId: string): Promise<boolean> {
    return this.existsBy({ eventId });
  }
}
