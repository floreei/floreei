import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { EventAttachmentEntity } from "./event-attachment.entity";

@Injectable()
export class EventAttachmentRepository extends TenantScopedRepository<EventAttachmentEntity> {
  constructor(
    @InjectRepository(EventAttachmentEntity)
    repo: Repository<EventAttachmentEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Anexo");
  }

  listForEvent(eventId: string): Promise<EventAttachmentEntity[]> {
    return this.findAll({ where: { eventId }, order: { createdAt: "ASC" } });
  }
}
