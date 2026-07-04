import { Injectable } from "@nestjs/common";
import type { DreReport } from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { EventRepository } from "../../events/infrastructure/event.repository";
import { ExpenseRepository } from "../../expenses/infrastructure/expense.repository";
import { PurchaseRepository } from "../../purchases/infrastructure/purchase.repository";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function margin(part: number, whole: number): number {
  return whole > 0 ? roundMoney((part / whole) * 100) : 0;
}

@Injectable()
export class DreService {
  constructor(
    private readonly events: EventRepository,
    private readonly purchases: PurchaseRepository,
    private readonly expenses: ExpenseRepository,
  ) {}

  async generate(fromInput?: string, toInput?: string): Promise<DreReport> {
    const now = new Date();
    const from =
      fromInput ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const to =
      toInput ??
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      )}`;

    const revenueRow = await this.events
      .qb("event")
      .select("COALESCE(SUM(event.sold_value),0)", "v")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from, to })
      .getRawOne<{ v: string }>();

    const cmvRow = await this.purchases
      .qb("purchase")
      .select("COALESCE(SUM(purchase.total),0)", "v")
      .andWhere("purchase.status <> 'CANCELED'")
      .andWhere("purchase.date BETWEEN :from AND :to", { from, to })
      .getRawOne<{ v: string }>();

    const expenses = await this.expenses.sumByCostCenter(from, to);

    const revenue = roundMoney(Number(revenueRow?.v ?? 0));
    const cmv = roundMoney(Number(cmvRow?.v ?? 0));
    const grossProfit = roundMoney(revenue - cmv);
    const expensesTotal = roundMoney(
      expenses.reduce((acc, e) => acc + e.amount, 0),
    );
    const netResult = roundMoney(grossProfit - expensesTotal);

    return {
      from,
      to,
      revenue,
      cmv,
      grossProfit,
      grossMargin: margin(grossProfit, revenue),
      expenses,
      expensesTotal,
      netResult,
      netMargin: margin(netResult, revenue),
    };
  }
}
