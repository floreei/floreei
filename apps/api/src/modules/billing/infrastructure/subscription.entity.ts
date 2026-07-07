import type { PlanTier, SubscriptionStatus } from "@sistema-flores/types";
import { Column, Entity } from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/**
 * Assinatura recorrente da plataforma (Mercado Pago preapproval). Uma linha por
 * preapproval — histórico preservado; a vigente é a mais recente não-cancelada.
 * O estado corrente também fica denormalizado em `companies` para o guard.
 */
@Entity({ name: "subscriptions" })
export class SubscriptionEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 16 })
  tier!: PlanTier;

  @Column({ name: "mp_preapproval_id", type: "varchar", length: 120, unique: true })
  mpPreapprovalId!: string;

  @Column({ type: "varchar", length: 16, default: "PENDING" })
  status!: SubscriptionStatus;

  /** Valor mensal vigente (base do plano + usuários × R$16). */
  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  amount!: number;

  /** Nº de usuários ativos considerado no último cálculo do valor. */
  @Column({ name: "billed_users", type: "int", default: 0 })
  billedUsers!: number;

  /** Início da pendência de pagamento (falha de cobrança/pausa/cancelamento). */
  @Column({ name: "payment_failed_at", type: "timestamptz", nullable: true })
  paymentFailedAt!: Date | null;
}
