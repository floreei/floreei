import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  AtRiskCustomer,
  IdleItem,
  InsightsQuery,
  PartyRanking,
  PendingDeliveries,
  PendingDeliverySale,
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

const PENDING_STATUS_WHERE = "event.status IN ('CONFIRMED', 'IN_PROGRESS')";
const DELIVERED_STATUS_WHERE = "event.status = 'DONE'";
/**
 * As entregas são filtradas pelo DIA EFETIVO de entrega (combinado, senão o da
 * venda) — é o que a rota do dia precisa. Os demais insights seguem pela data
 * da venda.
 */
const DELIVERY_DAY_IN_PERIOD =
  "COALESCE(event.delivery_date, event.date) BETWEEN :from AND :to";

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
    const [
      topItems,
      idleItems,
      topCustomers,
      atRiskCustomers,
      pendingDeliveries,
      delivered,
    ] = await Promise.all([
      this.topItems(f),
      this.idleItems(from, to, query.channel),
      this.topCustomers(f),
      this.atRiskCustomers(from, query.channel),
      this.deliveries(f, PENDING_STATUS_WHERE),
      this.deliveries(f, DELIVERED_STATUS_WHERE),
    ]);
    return {
      from,
      to,
      topItems,
      idleItems,
      topCustomers,
      atRiskCustomers,
      pendingDeliveries,
      delivered,
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
   * Entregas do período numa situação fixa — o que falta entregar
   * (CONFIRMED/IN_PROGRESS) ou o que já foi entregue (DONE) — um pedido por
   * venda, com as quantidades por item. O mesmo cliente com pedidos para dias
   * diferentes aparece uma vez por pedido. O período vale pelo dia efetivo de
   * entrega (`delivery_date`, senão `date`). Ignora o filtro `delivered` (cada
   * visão já fixa o status por definição).
   */
  private async deliveries(
    f: InsightsFilters,
    statusWhere: string,
  ): Promise<PendingDeliveries> {
    const salesQb = this.events
      .qb("event")
      .leftJoin("event.customer", "customer")
      .select("event.id", "id")
      .addSelect("customer.id", "customerId")
      .addSelect("customer.name", "customerName")
      .addSelect("TO_CHAR(event.date, 'YYYY-MM-DD')", "date")
      .addSelect("TO_CHAR(event.delivery_date, 'YYYY-MM-DD')", "deliveryDate")
      .addSelect("event.sold_value", "totalValue")
      .andWhere(statusWhere)
      .andWhere(DELIVERY_DAY_IN_PERIOD, { from: f.from, to: f.to });
    applyEventListFilters(salesQb, f, { skipDelivered: true });
    const sales = await salesQb.getRawMany<{
      id: string;
      customerId: string | null;
      customerName: string | null;
      date: string;
      deliveryDate: string | null;
      totalValue: string;
    }>();

    const cid = this.tenant.getCompanyIdOrThrow();
    const kindExpr =
      "CASE WHEN ei.product_id IS NOT NULL THEN 'product' ELSE 'arrangement' END";
    const itemsQb = this.items
      .createQueryBuilder("ei")
      .innerJoin("ei.event", "event")
      .leftJoin("event.customer", "customer")
      .select("event.id", "saleId")
      .addSelect("COALESCE(ei.product_id, ei.arrangement_id)", "id")
      .addSelect("MAX(ei.description)", "name")
      .addSelect(kindExpr, "kind")
      .addSelect("ei.unit", "unit")
      .addSelect("SUM(ei.quantity)", "quantity")
      .addSelect("COALESCE(SUM(ei.line_total),0)", "value")
      .where("event.company_id = :cid", { cid })
      .andWhere(statusWhere)
      .andWhere(DELIVERY_DAY_IN_PERIOD, { from: f.from, to: f.to })
      .andWhere("COALESCE(ei.product_id, ei.arrangement_id) IS NOT NULL");
    applyEventListFilters(itemsQb, f, { skipDelivered: true });
    const items = await itemsQb
      .groupBy("event.id")
      .addGroupBy("COALESCE(ei.product_id, ei.arrangement_id)")
      .addGroupBy(kindExpr)
      .addGroupBy("ei.unit")
      .getRawMany<{
        saleId: string;
        id: string;
        name: string;
        kind: "product" | "arrangement";
        unit: string;
        quantity: string;
        value: string;
      }>();

    const bySale = new Map<string, PendingDeliverySale>();
    for (const s of sales) {
      bySale.set(s.id, {
        id: s.id,
        customerId: s.customerId ?? null,
        customerName: s.customerName ?? null,
        date: s.date,
        deliveryDate: s.deliveryDate ?? null,
        totalValue: roundMoney(Number(s.totalValue) || 0),
        items: [],
      });
    }
    let totalQuantity = 0;
    for (const it of items) {
      const entry = bySale.get(it.saleId);
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

    const dayOf = (s: PendingDeliverySale) => s.deliveryDate ?? s.date;
    const result = [...bySale.values()];
    for (const s of result) s.items.sort((a, b) => b.quantity - a.quantity);
    result.sort(
      (a, b) =>
        dayOf(a).localeCompare(dayOf(b)) ||
        (a.customerName ?? "").localeCompare(b.customerName ?? "", "pt-BR") ||
        a.id.localeCompare(b.id),
    );

    return {
      salesCount: result.length,
      totalQuantity,
      totalValue: roundMoney(result.reduce((sum, s) => sum + s.totalValue, 0)),
      sales: result,
    };
  }
}

