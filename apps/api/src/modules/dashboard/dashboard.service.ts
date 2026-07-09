import { Injectable } from "@nestjs/common";
import type {
  DashboardSummary,
  FirstSteps,
  RevenuePoint,
} from "@sistema-flores/types";
import { DataSource } from "typeorm";
import { roundMoney } from "../../common/money/money";
import { TenantContextService } from "../../common/tenant/tenant-context.service";
import { toEvent } from "../events/application/event.mapper";
import { EventRepository } from "../events/infrastructure/event.repository";
import { toQuote } from "../quotes/application/quote.mapper";
import { QuoteRepository } from "../quotes/infrastructure/quote.repository";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function firstDay(date: Date): string {
  return `${monthKey(date)}-01`;
}

function lastDay(date: Date): string {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return `${monthKey(date)}-${pad(end.getDate())}`;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly events: EventRepository,
    private readonly quotes: QuoteRepository,
    private readonly dataSource: DataSource,
    private readonly tenant: TenantContextService,
  ) {}

  /** Checklist de primeiros passos do onboarding (card do trial no Início). */
  async firstSteps(): Promise<FirstSteps> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const [row] = (await this.dataSource.query(
      `SELECT
         (SELECT COUNT(*)::int FROM products WHERE company_id = $1) AS products,
         (SELECT COUNT(*)::int FROM customers WHERE company_id = $1) AS customers,
         (SELECT COUNT(*)::int FROM events WHERE company_id = $1) AS sales,
         (SELECT COUNT(*)::int FROM users WHERE company_id = $1 AND active = true) AS members,
         (SELECT store_enabled FROM companies WHERE id = $1) AS store_enabled`,
      [companyId],
    )) as [
      {
        products: number;
        customers: number;
        sales: number;
        members: number;
        store_enabled: boolean;
      },
    ];
    return {
      hasProduct: row.products > 0,
      hasCustomer: row.customers > 0,
      hasSale: row.sales > 0,
      storeEnabled: row.store_enabled,
      hasTeammate: row.members > 1,
    };
  }

  async summary(reference = new Date()): Promise<DashboardSummary> {
    const monthStart = firstDay(reference);
    const monthEnd = lastDay(reference);
    const today = `${reference.getFullYear()}-${pad(reference.getMonth() + 1)}-${pad(reference.getDate())}`;

    const monthAgg = await this.events
      .qb("event")
      .select("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(event.sold_value), 0)", "revenue")
      .addSelect("COALESCE(SUM(event.estimated_profit), 0)", "profit")
      .andWhere("event.date BETWEEN :start AND :end", {
        start: monthStart,
        end: monthEnd,
      })
      .andWhere("event.status <> 'CANCELED'")
      .getRawOne<{ count: string; revenue: string; profit: string }>();

    const receivableRow = await this.events
      .qb("event")
      .select(
        "COALESCE(SUM(event.sold_value - event.received_value), 0)",
        "due",
      )
      .andWhere("event.status <> 'CANCELED'")
      .getRawOne<{ due: string }>();

    const pendingQuotes = await this.quotes
      .qb("quote")
      .andWhere("quote.status IN ('DRAFT', 'SENT')")
      .getCount();

    const upcoming = await this.events
      .qb("event")
      .leftJoinAndSelect("event.customer", "customer")
      .andWhere("event.date >= :today", { today })
      .andWhere("event.status <> 'CANCELED'")
      // Widget linka pra /vendas (varejo) — atacado tem sua própria lista.
      .andWhere("event.channel = 'RETAIL'")
      .orderBy("event.date", "ASC")
      .limit(5)
      .getMany();

    const recent = await this.quotes
      .qb("quote")
      .leftJoinAndSelect("quote.customer", "customer")
      .orderBy("quote.created_at", "DESC")
      .limit(5)
      .getMany();

    return {
      month: monthKey(reference),
      eventsThisMonth: Number(monthAgg?.count ?? 0),
      revenueThisMonth: roundMoney(Number(monthAgg?.revenue ?? 0)),
      estimatedProfitThisMonth: roundMoney(Number(monthAgg?.profit ?? 0)),
      pendingQuotes,
      accountsReceivable: roundMoney(Number(receivableRow?.due ?? 0)),
      upcomingEvents: upcoming.map(toEvent),
      recentQuotes: recent.map(toQuote),
      revenueSeries: await this.revenueSeries(reference),
    };
  }

  /** Receita e lucro estimado dos últimos 6 meses. */
  private async revenueSeries(reference: Date): Promise<RevenuePoint[]> {
    const start = new Date(reference.getFullYear(), reference.getMonth() - 5, 1);
    const rows = await this.events
      .qb("event")
      .select("to_char(event.date, 'YYYY-MM')", "month")
      .addSelect("COALESCE(SUM(event.sold_value), 0)", "revenue")
      .addSelect("COALESCE(SUM(event.estimated_profit), 0)", "profit")
      .andWhere("event.date >= :start", { start: firstDay(start) })
      .andWhere("event.status <> 'CANCELED'")
      .groupBy("month")
      .getRawMany<{ month: string; revenue: string; profit: string }>();

    const byMonth = new Map(rows.map((r) => [r.month, r]));
    const series: RevenuePoint[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
      const key = monthKey(d);
      const row = byMonth.get(key);
      series.push({
        month: key,
        revenue: roundMoney(Number(row?.revenue ?? 0)),
        profit: roundMoney(Number(row?.profit ?? 0)),
      });
    }
    return series;
  }
}
