import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { UserEntity } from "./user.entity";

/** Repositório de usuários, isolado por empresa. */
@Injectable()
export class UserRepository extends TenantScopedRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity) repo: Repository<UserEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Usuário");
  }

  /** Verifica se o e-mail já existe em QUALQUER empresa (unicidade global). */
  async emailExistsGlobally(email: string): Promise<boolean> {
    return (await this.repo.count({ where: { email } })) > 0;
  }
}
