import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  AtRiskCustomer,
  IdleItem,
  InsightsQuery,
  PartyRanking,
  PendingDeliveries,
  PendingDeliveryCustomer,
  ProductUnit,
  SalesChannel,
  SalesInsights,
  SoldItemRanking,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney } from "../../../common/money/money";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ArrangementEntity } from "../../arrangements/infrastructure/arrangement.entity";
import { ProductEntity } from "../../catalog/infrastructure/product.entity";
import {
  applyEventListFilters,
  defaultMonthRange,
  type EventListFilters,
} from "./event-list-filters";
import { EventItemEntity } from "../infrastructure/event-item.entity";
import { EventRepository } from "../infrastructure/event.repository";

/** Filtros normalizados (período resolvido) aplicados às queries de insight. */
type InsightsFilters = EventListFilters;

/**
 * Insights práticos da tela de Vendas (gated por SALES). Reaproveita os padrões
 * de query dos relatórios para "mais vendido / top cliente" e adiciona os que o
 * usuário pediu para virar ação: itens encalhados (0 venda no período) e
 * clientes em risco (compraram antes, sumiram no período).
 *
 * NÃO reusa o endpoint /reports (que é gated por REPORTS, feature paga à parte)
 * — replicar as queries aqui mantém o gate correto sem vazar a feature de
 * relatórios para quem só tem vendas.
 */
@Injectable()
export class SalesInsightsService {
  constructor(
    private readonly events: EventRepository,
    private readonly tenant: TenantContextService,
    @InjectRepository(EventItemEntity)
    private readonly items: Repository<EventItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(ArrangementEntity)
    private readonly arrangements: Repository<ArrangementEntity>,
  ) {}

  async generate(query: InsightsQuery): Promise<SalesInsights> {
    const { from, to } = defaultMonthRange(query.from, query.to);
    const f: InsightsFilters = { ...query, from, to };
    const [topItems, idleItems, topCustomers, atRiskCustomers, pendingDeliveries] =
      await Promise.all([
        this.topItems(f),
        this.idleItems(from, to, query.channel),
        this.topCustomers(f),
        this.atRiskCustomers(from, query.channel),
        this.pendingDeliveries(f),
      ]);
    return {
      from,
      to,
      topItems,
      idleItems,
      topCustomers,
      atRiskCustomers,
      pendingDeliveries,
    };
  }

  /** Itens (insumo ou buquê) mais vendidos no período, por quantidade. */
  private async topItems(f: InsightsFilters): Promise<SoldItemRanking[]> {
    const cid = this.tenant.getCompanyIdOrThrow();
    const kindExpr =
      "CASE WHEN ei.product_id IS NOT NULL THEN 'product' ELSE 'arrangement' END";
    const qb = this.items
      .createQueryBuilder("ei")
      .innerJoin("ei.event", "event")
      .leftJoin("event.customer", "customer")
      .select("COALESCE(ei.product_id, ei.arrangement_id)", "id")
      .addSelect("MAX(ei.description)", "name")
      .addSelect(kindExpr, "kind")
      .addSelect("SUM(ei.quantity)", "quantity")
      .addSelect("SUM(ei.line_total)", "revenue")
      .where("event.company_id = :cid", { cid })
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to })
      .andWhere("COALESCE(ei.product_id, ei.arrangement_id) IS NOT NULL");
    applyEventListFilters(qb, f);
    const rows = await qb
      .groupBy("COALESCE(ei.product_id, ei.arrangement_id)")
      .addGroupBy(kindExpr)
      .orderBy("quantity", "DESC")
      .limit(5)
      .getRawMany<{
        id: string;
        name: string;
        kind: "product" | "arrangement";
        quantity: string;
        revenue: string;
      }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      quantity: Number(r.quantity) || 0,
      revenue: roundMoney(Number(r.revenue ?? 0)),
    }));
  }

  /** Insumos e buquês ativos sem NENHUMA venda no período (encalhados). */
  private async idleItems(
    from: string,
    to: string,
    channel?: SalesChannel,
  ): Promise<IdleItem[]> {
    const cid = this.tenant.getCompanyIdOrThrow();
    // channel é enum validado (RETAIL/WHOLESALE) — seguro interpolar.
    const chanS = channel ? `AND se.channel = '${channel}'` : "";
    const chanL = channel ? `AND le.channel = '${channel}'` : "";

    const notSoldInPeriod = (idColumn: string) =>
      `NOT EXISTS (
        SELECT 1 FROM event_items sei
        JOIN events se ON se.id = sei.event_id
        WHERE sei.${idColumn} = base.id
          AND se.status <> 'CANCELED'
          ${chanS}
          AND se.date BETWEEN :from AND :to
      )`;
    const lastSold = (idColumn: string) =>
      `(SELECT TO_CHAR(MAX(le.date), 'YYYY-MM-DD') FROM event_items lei
        JOIN events le ON le.id = lei.event_id
        WHERE lei.${idColumn} = base.id AND le.status <> 'CANCELED' ${chanL})`;

    type IdleRow = {
      id: string;
      name: string;
      kind: "product" | "arrangement";
      lastSoldAt: string | null;
    };
    const products = await this.products
      .createQueryBuilder("base")
      .select("base.id", "id")
      .addSelect("base.name", "name")
      .addSelect("'product'", "kind")
      .addSelect(lastSold("product_id"), "lastSoldAt")
      .where("base.company_id = :cid", { cid })
      .andWhere("base.active = true")
      .andWhere(notSoldInPeriod("product_id"), { from, to })
      .getRawMany<IdleRow>();

    // No atacado só vendemos insumos — buquês não entram nos "encalhados".
    const arrangements: IdleRow[] =
      channel === "WHOLESALE"
        ? []
        : await this.arrangements
            .createQueryBuilder("base")
            .select("base.id", "id")
            .addSelect("base.name", "name")
            .addSelect("'arrangement'", "kind")
            .addSelect(lastSold("arrangement_id"), "lastSoldAt")
            .where("base.company_id = :cid", { cid })
            .andWhere("base.active = true")
            .andWhere(notSoldInPeriod("arrangement_id"), { from, to })
            .getRawMany<IdleRow>();

    const merged: IdleItem[] = [...products, ...arrangements].map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      lastSoldAt: r.lastSoldAt ?? null,
    }));

    // Encalhado há mais tempo primeiro (nunca vendido = null vem antes).
    merged.sort((a, b) => {
      if (a.lastSoldAt === b.lastSoldAt) return 0;
      if (a.lastSoldAt === null) return -1;
      if (b.lastSoldAt === null) return 1;
      return a.lastSoldAt.localeCompare(b.lastSoldAt);
    });
    return merged.slice(0, 6);
  }

  /** Clientes que mais compraram no período (por receita). */
  private async topCustomers(f: InsightsFilters): Promise<PartyRanking[]> {
    const qb = this.events
      .qb("event")
      .innerJoin("event.customer", "customer")
      .select("customer.id", "id")
      .addSelect("customer.name", "name")
      .addSelect("COALESCE(SUM(event.sold_value),0)", "total")
      .addSelect("COUNT(*)", "count")
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to });
    applyEventListFilters(qb, f);
    const rows = await qb
      .groupBy("customer.id")
      .addGroupBy("customer.name")
      .orderBy("total", "DESC")
      .limit(5)
      .getRawMany<{ id: string; name: string; total: string; count: string }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      total: roundMoney(Number(r.total ?? 0)),
      count: Number(r.count ?? 0),
    }));
  }

  /** Clientes com compra anterior ao período e nenhuma dentro dele (sumiram). */
  private async atRiskCustomers(
    from: string,
    channel?: SalesChannel,
  ): Promise<AtRiskCustomer[]> {
    const qb = this.events
      .qb("event")
      .innerJoin("event.customer", "customer")
      .select("customer.id", "id")
      .addSelect("customer.name", "name")
      .addSelect("TO_CHAR(MAX(event.date), 'YYYY-MM-DD')", "lastPurchaseAt")
      .addSelect("COALESCE(SUM(event.sold_value),0)", "total")
      .andWhere("event.status <> 'CANCELED'");
    if (channel) qb.andWhere("event.channel = :channel", { channel });
    const rows = await qb
      .groupBy("customer.id")
      .addGroupBy("customer.name")
      .having("MAX(event.date) < :from", { from })
      .orderBy("MAX(event.date)", "ASC")
      .limit(5)
      .getRawMany<{
        id: string;
        name: string;
        lastPurchaseAt: string | null;
        total: string;
      }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      lastPurchaseAt: r.lastPurchaseAt ?? null,
      total: roundMoney(Number(r.total ?? 0)),
    }));
  }

  /**
   * O que falta entregar no período: vendas CONFIRMED/IN_PROGRESS agrupadas
   * por cliente, com as quantidades por item. Ignora o filtro `delivered`
   * (a seção já é, por definição, "não entregue").
   */
  private async pendingDeliveries(f: InsightsFilters): Promise<PendingDeliveries> {
    const pendingWhere = "event.status IN ('CONFIRMED', 'IN_PROGRESS')";

    const salesQb = this.events
      .qb("event")
      .leftJoin("event.customer", "customer")
      .select("customer.id", "customerId")
      .addSelect("MAX(customer.name)", "customerName")
      .addSelect("COUNT(*)", "salesCount")
      .addSelect("COALESCE(SUM(event.sold_value),0)", "totalValue")
      .andWhere(pendingWhere)
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to });
    applyEventListFilters(salesQb, f, { skipDelivered: true });
    const sales = await salesQb
      .groupBy("customer.id")
      .getRawMany<{
        customerId: string | null;
        customerName: string | null;
        salesCount: string;
        totalValue: string;
      }>();

    const cid = this.tenant.getCompanyIdOrThrow();
    const kindExpr =
      "CASE WHEN ei.product_id IS NOT NULL THEN 'product' ELSE 'arrangement' END";
    const itemsQb = this.items
      .createQueryBuilder("ei")
      .innerJoin("ei.event", "event")
      .leftJoin("event.customer", "customer")
      .select("customer.id", "customerId")
      .addSelect("COALESCE(ei.product_id, ei.arrangement_id)", "id")
      .addSelect("MAX(ei.description)", "name")
      .addSelect(kindExpr, "kind")
      .addSelect("ei.unit", "unit")
      .addSelect("SUM(ei.quantity)", "quantity")
      .addSelect("COALESCE(SUM(ei.line_total),0)", "value")
      .where("event.company_id = :cid", { cid })
      .andWhere(pendingWhere)
      .andWhere("event.date BETWEEN :from AND :to", { from: f.from, to: f.to })
      .andWhere("COALESCE(ei.product_id, ei.arrangement_id) IS NOT NULL");
    applyEventListFilters(itemsQb, f, { skipDelivered: true });
    const items = await itemsQb
      .groupBy("customer.id")
      .addGroupBy("COALESCE(ei.product_id, ei.arrangement_id)")
      .addGroupBy(kindExpr)
      .addGroupBy("ei.unit")
      .getRawMany<{
        customerId: string | null;
        id: string;
        name: string;
        kind: "product" | "arrangement";
        unit: string;
        quantity: string;
        value: string;
      }>();

    const byCustomer = new Map<string, PendingDeliveryCustomer>();
    const keyOf = (id: string | null) => id ?? "__none__";
    for (const s of sales) {
      byCustomer.set(keyOf(s.customerId), {
        id: s.customerId ?? null,
        name: s.customerName ?? null,
        salesCount: Number(s.salesCount) || 0,
        totalValue: roundMoney(Number(s.totalValue) || 0),
        items: [],
      });
    }
    let totalQuantity = 0;
    for (const it of items) {
      const entry = byCustomer.get(keyOf(it.customerId));
      if (!entry) continue;
      const quantity = Number(it.quantity) || 0;
      totalQuantity += quantity;
      entry.items.push({
        id: it.id,
        name: it.name,
        kind: it.kind,
        quantity,
        unit: it.unit as ProductUnit,
        value: roundMoney(Number(it.value) || 0),
      });
    }

    const pendingOf = (c: PendingDeliveryCustomer) =>
      c.items.reduce((sum, i) => sum + i.quantity, 0);
    const customers = [...byCustomer.values()];
    for (const c of customers) c.items.sort((a, b) => b.quantity - a.quantity);
    customers.sort((a, b) => pendingOf(b) - pendingOf(a));

    return {
      salesCount: sales.reduce((s, r) => s + (Number(r.salesCount) || 0), 0),
      totalQuantity,
      totalValue: roundMoney(
        customers.reduce((s, c) => s + c.totalValue, 0),
      ),
      customers,
    };
  }
}
