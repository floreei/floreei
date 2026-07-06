import type { Expense, ExpenseAttachment } from "@sistema-flores/types";
import { ExpenseAttachmentEntity } from "../infrastructure/expense-attachment.entity";
import { ExpenseEntity } from "../infrastructure/expense.entity";

const iso = (v: Date | string): string =>
  v instanceof Date ? v.toISOString() : v;

export function toExpenseAttachment(
  a: ExpenseAttachmentEntity,
): ExpenseAttachment {
  return {
    id: a.id,
    expenseId: a.expenseId,
    label: a.label,
    url: a.url,
    kind: a.kind,
    contentType: a.contentType,
    createdAt: iso(a.createdAt),
  };
}

export function toExpense(
  entity: ExpenseEntity,
  attachments: ExpenseAttachmentEntity[] = [],
): Expense {
  return {
    id: entity.id,
    companyId: entity.companyId,
    description: entity.description,
    costCenter: entity.costCenter,
    amount: entity.amount,
    dueDate: entity.dueDate,
    paid: entity.paid,
    paidDate: entity.paidDate,
    paymentMethod: entity.paymentMethod,
    recurring: entity.recurring,
    notes: entity.notes,
    attachments: attachments.map(toExpenseAttachment),
    createdAt: iso(entity.createdAt),
    updatedAt: iso(entity.updatedAt),
  };
}
