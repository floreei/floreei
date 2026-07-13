import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/** Uma conversa com o assistente (agrupa as mensagens do transcript). */
@Entity({ name: "assistant_conversation" })
@Index("ix_assistant_conversation_company_updated", ["companyId", "updatedAt"])
export class AssistantConversationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "company_id", type: "uuid" })
  companyId!: string;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  /** Título curto (primeira fala do usuário). */
  @Column({ type: "varchar", length: 160 })
  title!: string;
}
