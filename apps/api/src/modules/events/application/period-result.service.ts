import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  PeriodResult,
  PeriodResultExpense,
  PeriodResultExpenseGroup,
  PeriodResultOrder,
  PeriodResultQuery,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney, splitProfit } from "../../../common/money/money";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ExpenseEntity } from "../../expenses/infrastructure/expense.entity";
import { EventEntity } from "../infrastructure/event.entity";

const pad = (n: number) => String(n).padStart(2, "0");
const localISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Margem em 0–100; null quando não há receita. */
function margin(value: number, revenue: number): number | null {
  return revenue > 0 ? roundMoney((value / revenue) * 100) : null;
}

/**
 * Resultado do período da tela Atacado: lucro por pedido/item (custo por item
 * gravado na venda), despesas lançadas por vencimento no período e líquido.
 *
 * Despesas não têm canal — são da empresa toda. A tela avisa isso.
 */
@Injectable()
export class PeriodResultService {
  constructor(
    private readonly tenant: TenantContextService,
    @InjectRepository(EventEntity)
    private readonly events: Repository<EventEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenses: Repository<ExpenseEntity>,
  ) {}

  private defaultRange(from?: string, to?: string) {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const monthEnd = localISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return {
      from: from ?? monthStart,
      to: to ?? monthEnd,
      defaulted: !from && !to,
    };
  }

  async generate(query: PeriodResultQuery): Promise<PeriodResult> {
    const cid = this.tenant.getCompanyIdOrThrow();
    const { from, to, defaulted } = this.defaultRange(query.from, query.to);

    const [orders, expenses] = await Promise.all([
      this.loadOrders(cid, { ...query, from, to }),
      this.loadExpenses(cid, from, to),
    ]);

    const revenue = roundMoney(orders.reduce((s, o) => s + o.soldValue, 0));
    const cost = roundMoney(orders.reduce((s, o) => s + o.cost, 0));
    const grossProfit = roundMoney(revenue - cost);
    const partnersShare = roundMoney(orders.reduce((s, o) => s + o.partnersShare, 0));
    const myProfit = roundMoney(grossProfit - partnersShare);
    const netValue = roundMoney(myProfit - expenses.total);

    return {
      from,
      to,
      defaultedPeriod: defaulted,
      sales: {
        count: orders.length,
        revenue,
        cost,
        grossProfit,
        grossMargin: margin(grossProfit, revenue),
        partnersShare,
        myProfit,
      },
      orders,
      expenses,
      net: { value: netValue, margin: margin(netValue, revenue) },
    };
  }

  /** Mesmos filtros da listagem (EventRepository.search), sem paginação, sem CANCELED. */
  private async loadOrders(
    cid: string,
    f: PeriodResultQuery & { from: string; to: string },
  ): Promise<PeriodResultOrder[]> {
    const qb = this.events
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.customer", "customer")
      .leftJoinAndSelect("event.items", "items")
      .where("event.company_id = :cid", { cid })
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to })
      .orderBy("event.date", "DESC")
      .addOrderBy("event.created_at", "DESC");

    if (f.channel) qb.andWhere("event.channel = :channel", { channel: f.channel });
    if (f.type) qb.andWhere("event.type = :type", { type: f.type });
    if (f.paymentStatus === "paid") {
      qb.andWhere("event.received_value >= event.sold_value");
    } else if (f.paymentStatus === "pending") {
      qb.andWhere("event.received_value < event.sold_value");
    } else if (f.paymentStatus === "overdue") {
      qb.andWhere("event.received_value < event.sold_value");
      qb.andWhere("event.date < CURRENT_DATE");
    }
    if (f.delivered === true) qb.andWhere("event.status = 'DONE'");
    else if (f.delivered === false)
      qb.andWhere("event.status IN ('CONFIRMED', 'IN_PROGRESS')");
    if (f.search) {
      qb.andWhere("(event.title ILIKE :s OR customer.name ILIKE :s)", {
        s: `%${f.search}%`,
      });
    }

    const rows = await qb.getMany();
    return rows.map((e) => {
      const profit = roundMoney(e.soldValue - e.cost);
      const partnersShare = e.partnersShare ?? 0;
      return {
        id: e.id,
        date: e.date,
        title: e.title,
        customerName: e.customer?.name ?? null,
        soldValue: e.soldValue,
        cost: e.cost,
        profit,
        partnersShare,
        myProfit: roundMoney(profit - partnersShare),
        items: [...(e.items ?? [])]
          .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
          .map((i) => {
            const unitCost = i.unitCost ?? null;
            const lineCost = unitCost === null ? null : roundMoney(i.quantity * unitCost);
            const lineProfit = lineCost === null ? null : roundMoney(i.lineTotal - lineCost);
            const profitShares = i.profitShares ?? 1;
            const split = lineProfit === null ? null : splitProfit(lineProfit, profitShares);
            return {
              description: i.description,
              quantity: i.quantity,
              unit: i.unit,
              unitSalePrice: i.unitSalePrice,
              unitCost,
              lineTotal: i.lineTotal,
              lineCost,
              lineProfit,
              profitShares,
              myLineProfit: split === null ? null : split.mine,
              partnersLineShare: split === null ? null : split.partners,
            };
          }),
      };
    });
  }

  /** Despesas por vencimento no período, agrupadas por centro de custo (maior total primeiro). */
  private async loadExpenses(
    cid: string,
    from: string,
    to: string,
  ): Promise<PeriodResult["expenses"]> {
    const rows = await this.expenses
      .createQueryBuilder("e")
      .where("e.company_id = :cid", { cid })
      .andWhere("e.due_date BETWEEN :from AND :to", { from, to })
      .orderBy("e.due_date", "ASC")
      .addOrderBy("e.created_at", "ASC")
      .getMany();

    const today = localISO(new Date());
    const byCenter = new Map<string, PeriodResultExpense[]>();
    for (const r of rows) {
      const entry: PeriodResultExpense = {
        id: r.id,
        description: r.description,
        amount: r.amount,
        dueDate: r.dueDate,
        paid: r.paid,
        overdue: !r.paid && r.dueDate < today,
      };
      const list = byCenter.get(r.costCenter) ?? [];
      list.push(entry);
      byCenter.set(r.costCenter, list);
    }

    const groups: PeriodResultExpenseGroup[] = [...byCenter.entries()]
      .map(([costCenter, entries]) => ({
        costCenter,
        total: roundMoney(entries.reduce((s, x) => s + x.amount, 0)),
        entries,
      }))
      .sort((a, b) => b.total - a.total);

    const total = roundMoney(rows.reduce((s, r) => s + r.amount, 0));
    const paidTotal = roundMoney(rows.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0));
    return {
      total,
      paidTotal,
      unpaidTotal: roundMoney(total - paidTotal),
      groups,
    };
  }
}
