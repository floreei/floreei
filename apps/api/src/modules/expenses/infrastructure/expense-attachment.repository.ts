import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ExpenseAttachmentEntity } from "./expense-attachment.entity";

@Injectable()
export class ExpenseAttachmentRepository extends TenantScopedRepository<ExpenseAttachmentEntity> {
  constructor(
    @InjectRepository(ExpenseAttachmentEntity)
    repo: Repository<ExpenseAttachmentEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Anexo");
  }

  listForExpense(expenseId: string): Promise<ExpenseAttachmentEntity[]> {
    return this.findAll({
      where: { expenseId },
      order: { createdAt: "ASC" },
    });
  }

  /** Anexos de várias despesas de uma vez (para a listagem). */
  listForExpenses(expenseIds: string[]): Promise<ExpenseAttachmentEntity[]> {
    if (expenseIds.length === 0) return Promise.resolve([]);
    return this.findAll({
      where: { expenseId: In(expenseIds) },
      order: { createdAt: "ASC" },
    });
  }
}
