import type { PaymentDirection, PaymentMethod } from "@sistema-flores/types";
import { Column, Entity, Index } from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/** Lançamento financeiro: recebimento (IN) de evento ou pagamento (OUT) de compra. */
@Entity({ name: "payments" })
@Index("ix_payments_company_date", ["companyId", "date"])
export class PaymentEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 4 })
  direction!: PaymentDirection;

  @Column({ name: "event_id", type: "uuid", nullable: true })
  eventId!: string | null;

  @Column({ name: "purchase_id", type: "uuid", nullable: true })
  purchaseId!: string | null;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "varchar", length: 16, default: "PIX" })
  method!: PaymentMethod;

  @Column({ type: "varchar", length: 160, nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  notes!: string | null;
}
