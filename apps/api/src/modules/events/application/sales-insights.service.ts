import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  AtRiskCustomer,
  IdleItem,
  PartyRanking,
  SalesInsights,
  SoldItemRanking,
} from "@sistema-flores/types";
import { Repository } from "typeorm";
import { roundMoney } from "../../../common/money/money";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { ArrangementEntity } from "../../arrangements/infrastructure/arrangement.entity";
import { ProductEntity } from "../../catalog/infrastructure/product.entity";
import { EventItemEntity } from "../infrastructure/event-item.entity";
import { EventRepository } from "../infrastructure/event.repository";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

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

  async generate(fromInput?: string, toInput?: string): Promise<SalesInsights> {
    const { from, to } = this.defaultRange(fromInput, toInput);
    const [topItems, idleItems, topCustomers, atRiskCustomers] =
      await Promise.all([
        this.topItems(from, to),
        this.idleItems(from, to),
        this.topCustomers(from, to),
        this.atRiskCustomers(from),
      ]);
    return { from, to, topItems, idleItems, topCustomers, atRiskCustomers };
  }

  /** Itens (insumo ou buquê) mais vendidos no período, por quantidade. */
  private async topItems(from: string, to: string): Promise<SoldItemRanking[]> {
    const cid = this.tenant.getCompanyIdOrThrow();
    const kindExpr =
      "CASE WHEN ei.product_id IS NOT NULL THEN 'product' ELSE 'arrangement' END";
    const rows = await this.items
      .createQueryBuilder("ei")
      .innerJoin("ei.event", "event")
      .select("COALESCE(ei.product_id, ei.arrangement_id)", "id")
      .addSelect("MAX(ei.description)", "name")
      .addSelect(kindExpr, "kind")
      .addSelect("SUM(ei.quantity)", "quantity")
      .addSelect("SUM(ei.line_total)", "revenue")
      .where("event.company_id = :cid", { cid })
      .andWhere("event.status <> 'CANCELED'")
      .andWhere("event.date BETWEEN :from AND :to", { from, to })
      .andWhere("COALESCE(ei.product_id, ei.arrangement_id) IS NOT NULL")
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
  private async idleItems(from: string, to: string): Promise<IdleItem[]> {
    const cid = this.tenant.getCompanyIdOrThrow();

    const notSoldInPeriod = (idColumn: string) =>
      `NOT EXISTS (
        SELECT 1 FROM event_items sei
        JOIN events se ON se.id = sei.event_id
        WHERE sei.${idColumn} = base.id
          AND se.status <> 'CANCELED'
          AND se.date BETWEEN :from AND :to
      )`;
    const lastSold = (idColumn: string) =>
      `(SELECT TO_CHAR(MAX(le.date), 'YYYY-MM-DD') FROM event_items lei
        JOIN events le ON le.id = lei.event_id
        WHERE lei.${idColumn} = base.id AND le.status <> 'CANCELED')`;

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

    const arrangements = await this.arrangements
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
  private async topCustomers(from: string, to: string): Promise<PartyRanking[]> {
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
  private async atRiskCustomers(from: string): Promise<AtRiskCustomer[]> {
    const rows = await this.events
      .qb("event")
      .innerJoin("event.customer", "customer")
      .select("customer.id", "id")
      .addSelect("customer.name", "name")
      .addSelect("TO_CHAR(MAX(event.date), 'YYYY-MM-DD')", "lastPurchaseAt")
      .addSelect("COALESCE(SUM(event.sold_value),0)", "total")
      .andWhere("event.status <> 'CANCELED'")
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
}
