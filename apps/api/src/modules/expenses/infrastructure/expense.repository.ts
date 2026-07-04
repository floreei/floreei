import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ExpenseQuery, Paginated } from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney } from "../../../common/money/money";
import { paginate } from "../../../common/database/paginate";
import { TenantScopedRepository } from "../../../common/database/tenant-scoped.repository";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
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
    const qb = this.qb("expense").orderBy("expense.date", "DESC");
    if (query.from) qb.andWhere("expense.date >= :from", { from: query.from });
    if (query.to) qb.andWhere("expense.date <= :to", { to: query.to });
    if (query.costCenter) {
      qb.andWhere("expense.cost_center = :cc", { cc: query.costCenter });
    }
    if (query.search) {
      qb.andWhere("expense.description ILIKE :s", { s: `%${query.search}%` });
    }
    return paginate(qb, query.page, query.pageSize);
  }

  /** Todas as despesas no período (para o extrato de caixa). */
  listInRange(from: string, to: string): Promise<ExpenseEntity[]> {
    return this.qb("expense")
      .andWhere("expense.date BETWEEN :from AND :to", { from, to })
      .orderBy("expense.date", "DESC")
      .getMany();
  }

  /** Soma de despesas por centro de custo no período. */
  async sumByCostCenter(
    from: string,
    to: string,
  ): Promise<Array<{ costCenter: string; amount: number }>> {
    const rows = await this.qb("expense")
      .select("expense.cost_center", "costCenter")
      .addSelect("COALESCE(SUM(expense.amount),0)", "amount")
      .andWhere("expense.date BETWEEN :from AND :to", { from, to })
      .groupBy("expense.cost_center")
      .orderBy("amount", "DESC")
      .getRawMany<{ costCenter: string; amount: string }>();
    return rows.map((r) => ({
      costCenter: r.costCenter,
      amount: roundMoney(Number(r.amount) || 0),
    }));
  }
}
