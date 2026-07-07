import type { Feature, PlanTier } from "@sistema-flores/types";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { decimalTransformer } from "../../common/database/decimal.transformer";

/**
 * Definição vigente de um plano (global, não pertence a tenant). Editável pelo
 * console do gestor — preço, preço por usuário e features não são fixos no
 * código; o código só carrega a semente inicial via migração.
 */
@Entity({ name: "plan_definitions" })
export class PlanDefinitionEntity {
  @PrimaryColumn({ type: "varchar", length: 16 })
  tier!: PlanTier;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ type: "varchar", length: 40 })
  name!: string;

  @Column({ type: "varchar", length: 80, default: "" })
  tagline!: string;

  @Column({
    name: "base_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  basePrice!: number;

  @Column({
    name: "user_price",
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 16,
    transformer: decimalTransformer,
  })
  userPrice!: number;

  @Column({ type: "jsonb", default: () => "'[]'" })
  features!: Feature[];
}
