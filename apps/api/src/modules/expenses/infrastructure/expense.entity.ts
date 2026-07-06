import type { PaymentMethod } from "@sistema-flores/types";
import { Column, Entity, Index, OneToMany } from "typeorm";
import { decimalTransformer } from "../../../common/database/decimal.transformer";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { ExpenseAttachmentEntity } from "./expense-attachment.entity";

/** Despesa operacional (aluguel, salários, transporte…). Saída de caixa ao pagar. */
@Entity({ name: "expenses" })
@Index("ix_expenses_company_due", ["companyId", "dueDate"])
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

  /** Data de vencimento. */
  @Column({ name: "due_date", type: "date" })
  dueDate!: string;

  @Column({ type: "boolean", default: false })
  paid!: boolean;

  @Column({ name: "paid_date", type: "date", nullable: true })
  paidDate!: string | null;

  @Column({
    name: "payment_method",
    type: "varchar",
    length: 16,
    nullable: true,
  })
  paymentMethod!: PaymentMethod | null;

  @Column({ type: "boolean", default: false })
  recurring!: boolean;

  @Column({ type: "varchar", length: 500, nullable: true })
  notes!: string | null;

  @OneToMany(() => ExpenseAttachmentEntity, (a) => a.expense, { cascade: true })
  attachments!: ExpenseAttachmentEntity[];
}
