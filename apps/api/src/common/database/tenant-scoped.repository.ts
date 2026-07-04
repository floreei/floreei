import { NotFoundException } from "@nestjs/common";
import {
  DeepPartial,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { TenantContextService } from "../tenant/tenant-context.service";
import { TenantOwnedEntity } from "./tenant-owned.entity";

/**
 * Repositório base que aplica o filtro de tenant (`companyId`) em TODA operação.
 * Implementações concretas de repositório herdam daqui — centralizando o
 * isolamento multi-tenant em um único lugar auditável.
 */
export abstract class TenantScopedRepository<T extends TenantOwnedEntity> {
  protected constructor(
    protected readonly repo: Repository<T>,
    protected readonly tenant: TenantContextService,
    private readonly entityLabel: string,
  ) {}

  protected get companyId(): string {
    return this.tenant.getCompanyIdOrThrow();
  }

  private scopedWhere(where?: FindOptionsWhere<T>): FindOptionsWhere<T> {
    return { ...(where ?? {}), companyId: this.companyId } as FindOptionsWhere<T>;
  }

  create(data: DeepPartial<T>): T {
    return this.repo.create({ ...data, companyId: this.companyId });
  }

  save(entity: T): Promise<T> {
    return this.repo.save(entity);
  }

  /** Atualiza apenas os campos escalares informados, sem disparar cascade. */
  async updateById(id: string, fields: Partial<T>): Promise<void> {
    await this.repo.update(
      this.scopedWhere({ id } as FindOptionsWhere<T>),
      fields as QueryDeepPartialEntity<T>,
    );
  }

  saveMany(entities: T[]): Promise<T[]> {
    return this.repo.save(entities);
  }

  findById(id: string, relations?: string[]): Promise<T | null> {
    return this.repo.findOne({
      where: this.scopedWhere({ id } as FindOptionsWhere<T>),
      relations,
    });
  }

  async findByIdOrFail(id: string, relations?: string[]): Promise<T> {
    const found = await this.findById(id, relations);
    if (!found) {
      throw new NotFoundException(`${this.entityLabel} não encontrado(a).`);
    }
    return found;
  }

  findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repo.findOne({ where: this.scopedWhere(where) });
  }

  findAll(options?: {
    where?: FindOptionsWhere<T>;
    order?: FindOptionsOrder<T>;
    relations?: string[];
  }): Promise<T[]> {
    return this.repo.find({
      where: this.scopedWhere(options?.where),
      order: options?.order,
      relations: options?.relations,
    });
  }

  count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repo.count({ where: this.scopedWhere(where) });
  }

  async existsBy(where: FindOptionsWhere<T>): Promise<boolean> {
    return (await this.count(where)) > 0;
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.repo.delete(
      this.scopedWhere({ id } as FindOptionsWhere<T>),
    );
    if (!result.affected) {
      throw new NotFoundException(`${this.entityLabel} não encontrado(a).`);
    }
  }

  /** QueryBuilder já filtrado pelo tenant. Use para consultas/relatórios. */
  qb(alias: string): SelectQueryBuilder<T> {
    return this.repo
      .createQueryBuilder(alias)
      .where(`${alias}.company_id = :companyId`, { companyId: this.companyId });
  }
}
