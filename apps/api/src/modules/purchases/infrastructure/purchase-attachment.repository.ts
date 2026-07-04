import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { PurchaseAttachmentEntity } from "./purchase-attachment.entity";

@Injectable()
export class PurchaseAttachmentRepository extends TenantScopedRepository<PurchaseAttachmentEntity> {
  constructor(
    @InjectRepository(PurchaseAttachmentEntity)
    repo: Repository<PurchaseAttachmentEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Anexo");
  }

  listForPurchase(purchaseId: string): Promise<PurchaseAttachmentEntity[]> {
    return this.findAll({ where: { purchaseId }, order: { createdAt: "ASC" } });
  }
}
