import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  PartyRanking,
  ProductRanking,
  ReportData,
  ReportSummary,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney } from "../../common/money/money";
import { TenantContextService } from "../../common/tenant/tenant-context.service";
import { EventRepository } from "../events/infrastructure/event.repository";
import { PaymentRepository } from "../finance/infrastructure/payment.repository";
import { PurchaseRepository } from "../purchases/infrastructure/purchase.repository";
import { QuoteItemEntity } from "../quotes/infrastructure/quote-item.entity";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly events: EventRepository,
    private readonly purchases: PurchaseRepository,
    private readonly payments: PaymentRepository,
    private readonly tenant: TenantContextService,
    @InjectRepository(QuoteItemEntity)
    private readonly quoteItems: Repository<QuoteItemEntity>,
  ) {}

  private defaultRange(from?: string, to?: string): { from: string; to: string } {
    const now = new Date();
    return {
      from: from ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
      to:
        to ??
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
          new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
        )}`,
    };
  }

  async generate(fromInput?: string, toInput?: string): Promise<ReportData> {
    const { from, to } = this.defaultRange(fromInput, toInput);

    const [summary, topProducts, suppliers, customers] = await Promise.all([
      this.summary(from, to),
      this.topProducts(from, to),
      this.supplierRanking(from, to),
      this.customerRanking(from, to),
    ]);

    return { from, to, summary, topProducts, suppliers, customers };
  }

  private async summary(from: string, to: string): Promise<ReportSummary> {
    const eventAgg = await this.events
      .qb("event")
      .select("COALESCE(SUM(event.sold_value),0)", "revenue")
      .addSelect("COUNT(*)", "count")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from, to })
      .getRawOne<{ revenue: string; count: string }>();

    const purchaseAgg = await this.purchases
      .qb("purchase")
      .select("COALESCE(SUM(purchase.total),0)", "cost")
      .andWhere("purchase.status <> 'CANCELED'")
      .andWhere("purchase.date BETWEEN :from AND :to", { from, to })
      .getRawOne<{ cost: string }>();

    const [received, paid] = await Promise.all([
      this.payments.sumInRange("IN", from, to),
      this.payments.sumInRange("OUT", from, to),
    ]);

    const revenue = roundMoney(Number(eventAgg?.revenue ?? 0));
    const purchasesCost = roundMoney(Number(purchaseAgg?.cost ?? 0));

    return {
      revenue,
      purchasesCost,
      grossProfit: roundMoney(revenue - purchasesCost),
      eventsCount: Number(eventAgg?.count ?? 0),
      received,
      paid,
    };
  }

  private async topProducts(from: string, to: string): Promise<ProductRanking[]> {
    const rows = await this.quoteItems
      .createQueryBuilder("item")
      .innerJoin("item.quote", "quote")
      .innerJoin("quote.event", "event")
      .innerJoin("item.product", "product")
      .select("product.id", "productId")
      .addSelect("product.name", "name")
      .addSelect("SUM(item.quantity)", "quantity")
      .addSelect("SUM(item.line_sale)", "revenue")
      .addSelect("SUM(item.line_profit)", "profit")
      .where("quote.company_id = :companyId", {
        companyId: this.tenant.getCompanyIdOrThrow(),
      })
      .andWhere("quote.status = 'APPROVED'")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from, to })
      .groupBy("product.id")
      .addGroupBy("product.name")
      .orderBy("quantity", "DESC")
      .limit(10)
      .getRawMany<{
        productId: string;
        name: string;
        quantity: string;
        revenue: string;
        profit: string;
      }>();

    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      quantity: Number(r.quantity) || 0,
      revenue: roundMoney(Number(r.revenue ?? 0)),
      profit: roundMoney(Number(r.profit ?? 0)),
    }));
  }

  private async supplierRanking(from: string, to: string): Promise<PartyRanking[]> {
    const rows = await this.purchases
      .qb("purchase")
      .innerJoin("purchase.supplier", "supplier")
      .select("supplier.id", "id")
      .addSelect("supplier.name", "name")
      .addSelect("COALESCE(SUM(purchase.total),0)", "total")
      .addSelect("COUNT(*)", "count")
      .andWhere("purchase.status <> 'CANCELED'")
      .andWhere("purchase.date BETWEEN :from AND :to", { from, to })
      .groupBy("supplier.id")
      .addGroupBy("supplier.name")
      .orderBy("total", "DESC")
      .limit(10)
      .getRawMany<{ id: string; name: string; total: string; count: string }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      total: roundMoney(Number(r.total ?? 0)),
      count: Number(r.count ?? 0),
    }));
  }

  private async customerRanking(from: string, to: string): Promise<PartyRanking[]> {
    const rows = await this.events
      .qb("event")
      .innerJoin("event.customer", "customer")
      .select("customer.id", "id")
      .addSelect("customer.name", "name")
      .addSelect("COALESCE(SUM(event.sold_value),0)", "total")
      .addSelect("COUNT(*)", "count")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from, to })
      .groupBy("customer.id")
      .addGroupBy("customer.name")
      .orderBy("total", "DESC")
      .limit(10)
      .getRawMany<{ id: string; name: string; total: string; count: string }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      total: roundMoney(Number(r.total ?? 0)),
      count: Number(r.count ?? 0),
    }));
  }
}
