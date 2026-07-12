import type { DunningStatus } from "@sistema-flores/types";
import { Column, Entity, Index } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/** Registro de cada lembrete disparado — dedupe (empresa+evento+passo) e histórico. */
@Entity({ name: "dunning_log" })
@Index("ux_dunning_log_event_step", ["companyId", "eventId", "step"], {
  unique: true,
})
export class DunningLogEntity extends TenantOwnedEntity {
  @Column({ name: "event_id", type: "uuid", nullable: true })
  eventId!: string | null;

  @Column({ name: "customer_name", type: "varchar", length: 160, nullable: true })
  customerName!: string | null;

  /** offsetDays do passo (negativo = antes do vencimento). */
  @Column({ type: "int" })
  step!: number;

  @Column({ type: "varchar", length: 16 })
  status!: DunningStatus;

  @Column({ type: "varchar", length: 32 })
  channel!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ name: "sent_at", type: "timestamptz" })
  sentAt!: Date;

  @Column({ type: "text", nullable: true })
  error!: string | null;
}
