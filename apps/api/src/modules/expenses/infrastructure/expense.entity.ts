import { Column, Entity, Index } from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";

/** Despesa operacional (aluguel, salários, transporte…). Saída de caixa. */
@Entity({ name: "expenses" })
@Index("ix_expenses_company_date", ["companyId", "date"])
export class ExpenseEntity extends TenantOwnedEntity {
  @Column({ type: "varchar", length: 160 })
  description!: string;

  @Column({ name: "cost_center", type: "varchar", length: 80 })
  costCenter!: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  notes!: string | null;
}
