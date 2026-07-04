import { Column, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

/**
 * Base de toda entidade pertencente a um tenant (empresa). O `companyId` é
 * preenchido automaticamente no insert pelo TenantSubscriber e filtrado em toda
 * leitura pelo TenantScopedRepository — garantindo isolamento entre empresas.
 */
export abstract class TenantOwnedEntity extends BaseEntity {
  @Index()
  @Column({ name: "company_id", type: "uuid" })
  companyId!: string;
}
