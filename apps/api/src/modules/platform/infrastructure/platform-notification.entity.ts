import type { PlatformNotificationType } from "@sistema-flores/types";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Notificação do console do gestor (operacional da plataforma, não de tenant).
 * Ex.: "Nova empresa cadastrada". Reusável para futuros eventos (pagamento,
 * churn, etc.).
 */
@Entity({ name: "platform_notifications" })
export class PlatformNotificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "varchar", length: 32 })
  type!: PlatformNotificationType;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", default: "" })
  body!: string;

  /** Empresa relacionada (para o console linkar ao detalhe). */
  @Column({ name: "company_id", type: "uuid", nullable: true })
  companyId!: string | null;

  @Column({ type: "boolean", default: false })
  read!: boolean;
}
