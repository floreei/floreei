import type { ExpenseAttachmentKind } from "@sistema-flores/types";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { TenantOwnedEntity } from "../../../common/database/tenant-owned.entity";
import { ExpenseEntity } from "./expense.entity";

/** Anexo de uma despesa (arquivo no Storage): a conta (BILL) ou o comprovante (RECEIPT). */
@Entity({ name: "expense_attachments" })
@Index("ix_expense_attachments_expense", ["expenseId"])
export class ExpenseAttachmentEntity extends TenantOwnedEntity {
  @Column({ name: "expense_id", type: "uuid" })
  expenseId!: string;

  @Column({ type: "varchar", length: 160 })
  label!: string;

  @Column({ type: "varchar", length: 1000 })
  url!: string;

  @Column({ type: "varchar", length: 12 })
  kind!: ExpenseAttachmentKind;

  @Column({ name: "content_type", type: "varchar", length: 100, nullable: true })
  contentType!: string | null;

  @ManyToOne(() => ExpenseEntity, (expense) => expense.attachments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "expense_id" })
  expense!: ExpenseEntity;
}
