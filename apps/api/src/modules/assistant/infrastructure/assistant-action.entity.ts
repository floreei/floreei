import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/** Uma ação EXECUTADA pelo assistente (auditoria: o que foi criado/editado). */
@Entity({ name: "assistant_action" })
@Index("ix_assistant_action_company_created", ["companyId", "createdAt"])
export class AssistantActionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "company_id", type: "uuid" })
  companyId!: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ name: "conversation_id", type: "uuid", nullable: true })
  conversationId!: string | null;

  /** Tipo do rascunho executado (CREATE_SALE, CREATE_PURCHASE, …). */
  @Column({ type: "varchar", length: 32 })
  kind!: string;

  /** Resumo legível ("Venda registrada e recebida."). */
  @Column({ type: "varchar", length: 300 })
  summary!: string;

  /** Link para o registro (ex.: "/vendas/abc"). */
  @Column({ type: "varchar", length: 200 })
  href!: string;
}
