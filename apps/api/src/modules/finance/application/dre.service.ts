import { Injectable } from "@nestjs/common";
import type { DreReport } from "@sistema-flores/types";
import { roundMoney } from "../../../common/money/money";
import { EventRepository } from "../../events/infrastructure/event.repository";
import { ExpenseRepository } from "../../expenses/infrastructure/expense.repository";
import { PurchaseRepository } from "../../purchases/infrastructure/purchase.repository";
import { StockService } from "../../stock/application/stock.service";

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
    private readonly stock: StockService,
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

    // Receita e COGS (custo do que foi vendido) por competência.
    const salesRow = await this.events
      .qb("event")
      .select("COALESCE(SUM(event.sold_value),0)", "revenue")
      .addSelect("COALESCE(SUM(event.cost),0)", "cogs")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from, to })
      .getRawOne<{ revenue: string; cogs: string }>();

    // Compras do período (saída de caixa, informativo — NÃO é o custo do vendido).
    const purchasesRow = await this.purchases
      .qb("purchase")
      .select("COALESCE(SUM(purchase.total),0)", "v")
      .andWhere("purchase.status <> 'CANCELED'")
      .andWhere("purchase.date BETWEEN :from AND :to", { from, to })
      .getRawOne<{ v: string }>();

    const [expenses, losses] = await Promise.all([
      this.expenses.sumByCostCenter(from, to),
      this.stock.lossesValue(from, to),
    ]);

    const revenue = roundMoney(Number(salesRow?.revenue ?? 0));
    const cmv = roundMoney(Number(salesRow?.cogs ?? 0));
    const purchasesTotal = roundMoney(Number(purchasesRow?.v ?? 0));
    const grossProfit = roundMoney(revenue - cmv);
    const expensesTotal = roundMoney(
      expenses.reduce((acc, e) => acc + e.amount, 0),
    );
    const netResult = roundMoney(grossProfit - expensesTotal - losses);

    return {
      from,
      to,
      revenue,
      cmv,
      grossProfit,
      grossMargin: margin(grossProfit, revenue),
      purchasesTotal,
      losses,
      expenses,
      expensesTotal,
      netResult,
      netMargin: margin(netResult, revenue),
    };
  }
}
