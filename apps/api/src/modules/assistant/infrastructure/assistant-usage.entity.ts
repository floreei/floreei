import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

/** Um registro de consumo do assistente (tokens) — somado por empresa/mês. */
@Entity({ name: "assistant_usage" })
@Index("ix_assistant_usage_company_created", ["companyId", "createdAt"])
export class AssistantUsageEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "company_id", type: "uuid" })
  companyId!: string;

  @Column({ name: "input_tokens", type: "int", default: 0 })
  inputTokens!: number;

  @Column({ name: "output_tokens", type: "int", default: 0 })
  outputTokens!: number;

  @Column({ name: "cache_read_tokens", type: "int", default: 0 })
  cacheReadTokens!: number;

  @Column({ name: "cache_creation_tokens", type: "int", default: 0 })
  cacheCreationTokens!: number;
}
