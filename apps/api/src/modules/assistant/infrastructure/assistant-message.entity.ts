import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/** Uma fala do transcript (usuário ou assistente). */
@Entity({ name: "assistant_message" })
@Index("ix_assistant_message_conversation", ["conversationId", "createdAt"])
export class AssistantMessageEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "conversation_id", type: "uuid" })
  conversationId!: string;

  @Column({ name: "company_id", type: "uuid" })
  companyId!: string;

  @Column({ type: "varchar", length: 16 })
  role!: "user" | "assistant";

  @Column({ type: "text" })
  text!: string;
}
