import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ExpenseQuery, Paginated } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { roundMoney } from "../../../common/money/money";
import { ExpenseEntity } from "./expense.entity";

@Injectable()
export class ExpenseRepository extends TenantScopedRepository<ExpenseEntity> {
  constructor(
    @InjectRepository(ExpenseEntity) repo: Repository<ExpenseEntity>,
    tenant: TenantContextService,
  ) {
    super(repo, tenant, "Despesa");
  }

  async search(query: ExpenseQuery): Promise<Paginated<ExpenseEntity>> {
    const qb = this.qb("expense").orderBy("expense.due_date", "DESC");
    if (query.from)
      qb.andWhere("expense.due_date >= :from", { from: query.from });
    if (query.to) qb.andWhere("expense.due_date <= :to", { to: query.to });
    if (query.costCenter) {
      qb.andWhere("expense.cost_center = :cc", { cc: query.costCenter });
    }
    if (query.search) {
      qb.andWhere("expense.description ILIKE :s", { s: `%${query.search}%` });
    }
    if (query.status === "paid") qb.andWhere("expense.paid = true");
    if (query.status === "unpaid") qb.andWhere("expense.paid = false");
    if (query.status === "overdue") {
      qb.andWhere("expense.paid = false").andWhere(
        "expense.due_date < CURRENT_DATE",
      );
    }
    return paginate(qb, query.page, query.pageSize);
  }

  /** Despesas PAGAS no período pela data de pagamento (para o Caixa). */
  listPaidInRange(from: string, to: string): Promise<ExpenseEntity[]> {
    return this.qb("expense")
      .andWhere("expense.paid = true")
      .andWhere("expense.paid_date BETWEEN :from AND :to", { from, to })
      .orderBy("expense.paid_date", "DESC")
      .getMany();
  }

  /** Despesas ainda não pagas (contas a pagar). */
  listUnpaid(): Promise<ExpenseEntity[]> {
    return this.qb("expense")
      .andWhere("expense.paid = false")
      .orderBy("expense.due_date", "ASC")
      .getMany();
  }

  /** Soma por centro de custo no período pelo VENCIMENTO (competência, DRE). */
  async sumByCostCenter(
    from: string,
    to: string,
  ): Promise<Array<{ costCenter: string; amount: number }>> {
    const rows = await this.qb("expense")
      .select("expense.cost_center", "costCenter")
      .addSelect("COALESCE(SUM(expense.amount),0)", "amount")
      .andWhere("expense.due_date BETWEEN :from AND :to", { from, to })
      .groupBy("expense.cost_center")
      .orderBy("amount", "DESC")
      .getRawMany<{ costCenter: string; amount: string }>();
    return rows.map((r) => ({
      costCenter: r.costCenter,
      amount: roundMoney(Number(r.amount) || 0),
    }));
  }
}
