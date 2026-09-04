import { Injectable } from "@nestjs/common";
import type {
  PeriodResult,
  PeriodResultExpense,
  PeriodResultExpenseGroup,
  PeriodResultOrder,
  PeriodResultQuery,
} from "@sistema-flores/types";
import { roundMoney, splitProfit } from "../../../common/money/money";
import { ExpenseRepository } from "../../expenses/infrastructure/expense.repository";
import { applyEventListFilters, defaultMonthRange } from "./event-list-filters";
import { EventRepository } from "../infrastructure/event.repository";

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
    private readonly events: EventRepository,
    private readonly expenses: ExpenseRepository,
  ) {}

  private defaultRange(from?: string, to?: string) {
    const { from: resolvedFrom, to: resolvedTo } = defaultMonthRange(from, to);
    return { from: resolvedFrom, to: resolvedTo, defaulted: !from && !to };
  }

  async generate(query: PeriodResultQuery): Promise<PeriodResult> {
    const { from, to, defaulted } = this.defaultRange(query.from, query.to);

    const [orders, expenses] = await Promise.all([
      this.loadOrders({ ...query, from, to }),
      this.loadExpenses(from, to),
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
    f: PeriodResultQuery & { from: string; to: string },
  ): Promise<PeriodResultOrder[]> {
    const qb = this.events
      .qb("event")
      .leftJoinAndSelect("event.customer", "customer")
      .leftJoinAndSelect("event.items", "items")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to })
      .orderBy("event.date", "DESC")
      .addOrderBy("event.created_at", "DESC");
    applyEventListFilters(qb, f);

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
          .sort(
            (a, b) =>
              a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
          )
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

  /**
   * Despesas por vencimento no período, agrupadas por centro de custo (maior
   * total primeiro). Agrupamento ignora espaços nas pontas e maiúsculas —
   * "Salários" e "salários " caem no mesmo grupo — exibindo a primeira grafia
   * encontrada.
   */
  private async loadExpenses(from: string, to: string): Promise<PeriodResult["expenses"]> {
    const rows = await this.expenses
      .qb("expense")
      .andWhere("expense.due_date BETWEEN :from AND :to", { from, to })
      .orderBy("expense.due_date", "ASC")
      .addOrderBy("expense.created_at", "ASC")
      .getMany();

    const today = localISO(new Date());
    const byCenter = new Map<string, { label: string; entries: PeriodResultExpense[] }>();
    for (const r of rows) {
      const entry: PeriodResultExpense = {
        id: r.id,
        description: r.description,
        amount: r.amount,
        dueDate: r.dueDate,
        paid: r.paid,
        overdue: !r.paid && r.dueDate < today,
      };
      const key = r.costCenter.trim().toLocaleLowerCase("pt-BR");
      const bucket = byCenter.get(key);
      if (bucket) bucket.entries.push(entry);
      else byCenter.set(key, { label: r.costCenter, entries: [entry] });
    }

    const groups: PeriodResultExpenseGroup[] = [...byCenter.values()]
      .map(({ label, entries }) => ({
        costCenter: label,
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
