import type { CompanyPlan } from "@sistema-flores/types";
import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "../../../common/database/base.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";

/** Empresa = tenant. Raiz do isolamento multi-tenant. */
@Entity({ name: "companies" })
export class CompanyEntity extends BaseEntity {
  @Column({ type: "varchar", length: 160 })
  name!: string;

  /** Plano de acesso: TRIAL (período gratuito) ou ACTIVE (liberada sem prazo). */
  @Column({ type: "varchar", length: 16, default: "TRIAL" })
  plan!: CompanyPlan;

  /** Primeiro acesso autenticado — dispara a contagem do trial. */
  @Column({ name: "first_access_at", type: "timestamptz", nullable: true })
  firstAccessAt!: Date | null;

  /** Fim do período gratuito (extensível pelo console). */
  @Column({ name: "trial_ends_at", type: "timestamptz", nullable: true })
  trialEndsAt!: Date | null;

  /** Bloqueio manual pelo gestor da plataforma (tem precedência sobre o plano). */
  @Column({ type: "boolean", default: false })
  suspended!: boolean;

  /** Último acesso autenticado de qualquer usuário da empresa (throttle ~1h). */
  @Column({ name: "last_seen_at", type: "timestamptz", nullable: true })
  lastSeenAt!: Date | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  document!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  address!: string | null;

  @Column({ type: "text", nullable: true })
  logo!: string | null;

  @OneToMany(() => UserEntity, (user) => user.company)
  users!: UserEntity[];
}
