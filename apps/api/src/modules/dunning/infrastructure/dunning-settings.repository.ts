import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { DunningSettingsEntity } from "./dunning-settings.entity";

@Injectable()
export class DunningSettingsRepository extends TenantScopedRepository<DunningSettingsEntity> {
  constructor(
    @InjectRepository(DunningSettingsEntity)
    repo: Repository<DunningSettingsEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Cobrança");
  }

  findForCompany(): Promise<DunningSettingsEntity | null> {
    return this.findOneBy({});
  }
}
