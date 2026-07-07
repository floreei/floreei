import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  AT_RISK_INACTIVE_DAYS,
  type CompaniesQuery,
  type CompanyDetail,
  type CompanyListItem,
  type CompanyMetrics,
  type CompanySubscriptionInfo,
  type Paginated,
  type PlanTier,
  type PlatformCompanyUser,
  type PlatformOverview,
  type SalesLead,
  type SalesOverview,
  type UpdateEntitlementsInput,
  daysSince,
  resolveCompanyAccess,
} from "@sistema-flores/types";
import { Between, DataSource, In, Repository } from "typeorm";
import { FirebaseService } from "../../../common/firebase/firebase.service";
import { SubscriptionEntity } from "../../billing/infrastructure/subscription.entity";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";

const DAY_MS = 24 * 60 * 60 * 1000;

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** Estado de saúde derivado (status de acesso + inatividade + risco). */
function health(c: CompanyEntity, now: Date) {
  const resolved = resolveCompanyAccess(
    {
      plan: c.plan,
      suspended: c.suspended,
      trialEndsAt: c.trialEndsAt,
      subscriptionStatus: c.subscriptionStatus,
      paymentFailedAt: c.paymentFailedAt,
    },
    now,
  );
  const daysInactive = daysSince(c.lastSeenAt ?? c.createdAt, now);
  const atRisk =
    resolved.allowed &&
    daysInactive !== null &&
    daysInactive >= AT_RISK_INACTIVE_DAYS;
  return { resolved, daysInactive, atRisk };
}

@Injectable()
export class PlatformCompaniesService {
  private readonly logger = new Logger(PlatformCompaniesService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptions: Repository<SubscriptionEntity>,
    private readonly firebase: FirebaseService,
  ) {}

  // -------------------------------------------------------------------------
  // Leitura
  // -------------------------------------------------------------------------

  async overview(): Promise<PlatformOverview> {
    const companies = await this.companies.find();
    const now = new Date();
    const totals = { companies: companies.length, active: 0, trial: 0, expired: 0, suspended: 0 };
    let atRisk = 0;
    let activeLast7 = 0;
    let newLast7 = 0;
    let newLast30 = 0;

    for (const c of companies) {
      const { resolved, atRisk: risk } = health(c, now);
      if (resolved.status === "ACTIVE") totals.active += 1;
      else if (resolved.status === "TRIAL") totals.trial += 1;
      else if (resolved.status === "SUSPENDED") totals.suspended += 1;
      // EXPIRED e PAYMENT_OVERDUE = sem acesso por falta de pagamento.
      else totals.expired += 1;
      if (risk) atRisk += 1;

      const ageDays = daysSince(c.createdAt, now) ?? Infinity;
      if (ageDays <= 7) newLast7 += 1;
      if (ageDays <= 30) newLast30 += 1;

      const seenDays = daysSince(c.lastSeenAt, now);
      if (seenDays !== null && seenDays <= 7) activeLast7 += 1;
    }

    const [ev] = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS sales, COALESCE(SUM(sold_value), 0)::float AS revenue FROM events`,
    )) as [{ sales: number; revenue: number }];

    return {
      totals,
      newLast7,
      newLast30,
      atRisk,
      activeLast7,
      totalRevenue: ev.revenue,
      totalSales: ev.sales,
      sales: await this.salesOverview(companies, now),
    };
  }

  /** Bloco de vendas do console: MRR + listas para abordagem no WhatsApp. */
  private async salesOverview(
    companies: CompanyEntity[],
    now: Date,
  ): Promise<SalesOverview> {
    const byId = new Map(companies.map((c) => [c.id, c]));
    const lead = (c: CompanyEntity): SalesLead => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
    });

    // Receita recorrente: assinaturas autorizadas (cobrando todo mês).
    const authorized = await this.subscriptions.find({
      where: { status: "AUTHORIZED" },
    });
    const mrr = authorized.reduce((sum, s) => sum + s.amount, 0);
    const tierCounts = new Map<string, number>();
    for (const s of authorized) {
      tierCounts.set(s.tier, (tierCounts.get(s.tier) ?? 0) + 1);
    }

    // Trials vencendo em até 3 dias — a hora certa de chamar no WhatsApp.
    const trialsEndingSoon = companies
      .flatMap((c) => {
        const resolved = health(c, now).resolved;
        if (resolved.status !== "TRIAL" || resolved.trialDaysLeft === null) {
          return [];
        }
        if (resolved.trialDaysLeft > 3) return [];
        return [{ ...lead(c), trialDaysLeft: resolved.trialDaysLeft }];
      })
      .sort((a, b) => a.trialDaysLeft - b.trialDaysLeft);

    // Clicou em assinar e não concluiu o checkout (entre 1h e 14 dias atrás).
    const pending = await this.subscriptions.find({
      where: {
        status: "PENDING",
        createdAt: Between(
          new Date(now.getTime() - 14 * DAY_MS),
          new Date(now.getTime() - 60 * 60 * 1000),
        ),
      },
      order: { createdAt: "DESC" },
    });
    const pendingCheckouts = pending.flatMap((s) => {
      const c = byId.get(s.companyId);
      if (!c) return [];
      return [{ ...lead(c), tier: s.tier, createdAt: s.createdAt.toISOString() }];
    });

    // Pagamento pendente (dentro ou fora da carência) — recuperar antes do churn.
    const overdue = companies
      .filter((c) => c.paymentFailedAt !== null && !c.suspended)
      .map((c) => ({
        ...lead(c),
        graceDaysLeft: health(c, now).resolved.graceDaysLeft,
      }));

    return {
      mrr,
      subscribers: authorized.length,
      byTier: [...tierCounts.entries()].map(([tier, count]) => ({
        tier: tier as PlanTier,
        count,
      })),
      trialsEndingSoon,
      pendingCheckouts,
      overdue,
    };
  }

  async list(query: CompaniesQuery): Promise<Paginated<CompanyListItem>> {
    const companies = await this.companies.find();
    const usersMap = await this.groupCount(
      `SELECT company_id, COUNT(*)::int AS cnt FROM users WHERE active = true GROUP BY company_id`,
    );
    const salesRows = (await this.dataSource.query(
      `SELECT company_id, COUNT(*)::int AS sales, COALESCE(SUM(sold_value), 0)::float AS revenue FROM events GROUP BY company_id`,
    )) as { company_id: string; sales: number; revenue: number }[];
    const salesMap = new Map(salesRows.map((r) => [r.company_id, r]));
    const now = new Date();

    let items: CompanyListItem[] = companies.map((c) => {
      const { resolved, daysInactive, atRisk } = health(c, now);
      const sale = salesMap.get(c.id);
      return {
        id: c.id,
        name: c.name,
        status: resolved.status,
        plan: c.plan,
        tier: c.tier,
        trialDaysLeft: resolved.trialDaysLeft,
        createdAt: c.createdAt.toISOString(),
        firstAccessAt: iso(c.firstAccessAt),
        lastSeenAt: iso(c.lastSeenAt),
        daysInactive,
        atRisk,
        users: usersMap.get(c.id) ?? 0,
        sales: sale?.sales ?? 0,
        revenue: sale?.revenue ?? 0,
      };
    });

    if (query.search) {
      const q = query.search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (query.status) items = items.filter((i) => i.status === query.status);
    if (query.risk) items = items.filter((i) => i.atRisk);

    switch (query.sort) {
      case "recent":
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "revenue":
        items.sort((a, b) => b.revenue - a.revenue);
        break;
      case "name":
        items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        break;
      case "lastSeen":
      default:
        items.sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""));
        break;
    }

    const total = items.length;
    const start = (query.page - 1) * query.pageSize;
    return {
      data: items.slice(start, start + query.pageSize),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  }

  async detail(id: string): Promise<CompanyDetail> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException("Empresa não encontrada.");
    const now = new Date();
    const { resolved, daysInactive, atRisk } = health(company, now);
    const metrics = await this.companyMetrics(id);
    const team = await this.team(id);
    const subscription = await this.subscriptionInfo(id);

    return {
      id: company.id,
      name: company.name,
      document: company.document,
      phone: company.phone,
      email: company.email,
      createdAt: company.createdAt.toISOString(),
      firstAccessAt: iso(company.firstAccessAt),
      lastSeenAt: iso(company.lastSeenAt),
      trialEndsAt: iso(company.trialEndsAt),
      plan: company.plan,
      status: resolved.status,
      trialDaysLeft: resolved.trialDaysLeft,
      daysInactive,
      atRisk,
      tier: company.tier,
      featureOverrides: company.featureOverrides ?? {},
      founder: company.founder,
      subscription,
      metrics,
      team,
    };
  }

  // -------------------------------------------------------------------------
  // Ações de acesso
  // -------------------------------------------------------------------------

  /** Estende o período gratuito por `days`, a partir de hoje ou do fim atual. */
  async extendTrial(id: string, days: number): Promise<CompanyDetail> {
    const company = await this.load(id);
    const now = Date.now();
    const base = Math.max(now, company.trialEndsAt?.getTime() ?? now);
    company.trialEndsAt = new Date(base + days * DAY_MS);
    company.plan = "TRIAL";
    await this.companies.save(company);
    return this.detail(id);
  }

  /** Libera a empresa sem prazo (cliente pago/parceiro). */
  async activate(id: string): Promise<CompanyDetail> {
    const company = await this.load(id);
    company.plan = "ACTIVE";
    company.suspended = false;
    await this.companies.save(company);
    return this.detail(id);
  }

  async suspend(id: string): Promise<CompanyDetail> {
    const company = await this.load(id);
    company.suspended = true;
    await this.companies.save(company);
    return this.detail(id);
  }

  async reactivate(id: string): Promise<CompanyDetail> {
    const company = await this.load(id);
    company.suspended = false;
    await this.companies.save(company);
    return this.detail(id);
  }

  /**
   * Tabelas com `company_id`, na ordem de exclusão (referenciadora antes da
   * referenciada, por causa das FKs RESTRICT internas). Os filhos (itens,
   * anexos, movimentos) caem por CASCADE do pai. Deletar nesta ordem evita
   * violar FK; a raiz `companies` sai por último.
   */
  private static readonly DELETE_ORDER = [
    "subscriptions",
    "store_orders",
    "payments",
    "platform_notifications",
    "events", // → event_items, event_attachments
    "quotes", // → quote_items
    "arrangements", // → arrangement_items
    "purchases", // → purchase_items, purchase_attachments
    "expenses", // → expense_attachments
    "products", // → stock_movements
    "customers",
    "suppliers",
    "categories",
    "users",
  ] as const;

  /**
   * Exclui a empresa por completo: apaga todos os usuários no Firebase Auth e
   * todos os dados no banco (transacional). Operação irreversível — só OWNER.
   * Se o Firebase Admin não estiver configurado, o banco é limpo mesmo assim e
   * fica um aviso no log (os logins continuariam órfãos no Firebase).
   */
  async deleteCompany(id: string): Promise<{ ok: true; firebaseCleared: boolean }> {
    await this.load(id); // 404 se não existe
    const users = await this.users.find({ where: { companyId: id } });

    await this.dataSource.transaction(async (manager) => {
      for (const table of PlatformCompaniesService.DELETE_ORDER) {
        await manager.query(`DELETE FROM "${table}" WHERE company_id = $1`, [id]);
      }
      await manager.query(`DELETE FROM "companies" WHERE id = $1`, [id]);
    });

    // Firebase depois do commit (best-effort) — não desfaz a exclusão do banco.
    const firebaseEnabled = this.firebase.isAdminEnabled();
    if (!firebaseEnabled) {
      this.logger.warn(
        `Empresa ${id} excluída do banco, mas o Firebase Admin não está configurado — ${users.length} login(s) permanecem no Firebase Auth.`,
      );
    } else {
      for (const user of users) {
        if (!user.firebaseUid) continue;
        await this.firebase.deleteAuthUser(user.firebaseUid).catch((error) => {
          this.logger.error(
            `Falha ao apagar o usuário ${user.email} do Firebase`,
            error instanceof Error ? error.stack : String(error),
          );
        });
      }
    }

    return { ok: true, firebaseCleared: firebaseEnabled };
  }

  /** Define plano, overrides de feature e marca de fundador da empresa. */
  async updateEntitlements(
    id: string,
    input: UpdateEntitlementsInput,
  ): Promise<CompanyDetail> {
    const company = await this.load(id);
    if (input.tier !== undefined) company.tier = input.tier;
    if (input.featureOverrides !== undefined) {
      company.featureOverrides = input.featureOverrides;
    }
    if (input.founder !== undefined) company.founder = input.founder;
    await this.companies.save(company);
    return this.detail(id);
  }

  // -------------------------------------------------------------------------
  // Internos
  // -------------------------------------------------------------------------

  private async load(id: string): Promise<CompanyEntity> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException("Empresa não encontrada.");
    return company;
  }

  /** Assinatura em vigor (ou pendente) da empresa, para exibição no console. */
  private async subscriptionInfo(
    companyId: string,
  ): Promise<CompanySubscriptionInfo | null> {
    const row =
      (await this.subscriptions.findOne({
        where: { companyId, status: In(["AUTHORIZED", "PAUSED"]) },
        order: { createdAt: "DESC" },
      })) ??
      (await this.subscriptions.findOne({
        where: { companyId },
        order: { createdAt: "DESC" },
      }));
    if (!row) return null;
    return {
      status: row.status,
      tier: row.tier,
      amount: row.amount,
      billedUsers: row.billedUsers,
      paymentFailedAt: iso(row.paymentFailedAt),
    };
  }

  private async team(id: string): Promise<PlatformCompanyUser[]> {
    const rows = await this.users.find({
      where: { companyId: id },
      order: { createdAt: "ASC" },
    });
    return rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
    }));
  }

  private async groupCount(sql: string): Promise<Map<string, number>> {
    const rows = (await this.dataSource.query(sql)) as {
      company_id: string;
      cnt: number;
    }[];
    return new Map(rows.map((r) => [r.company_id, r.cnt]));
  }

  private async companyMetrics(companyId: string): Promise<CompanyMetrics> {
    const [row] = (await this.dataSource.query(
      `SELECT
         (SELECT COUNT(*)::int FROM users WHERE company_id = $1 AND active = true) AS users,
         (SELECT COUNT(*)::int FROM customers WHERE company_id = $1) AS customers,
         (SELECT COUNT(*)::int FROM products WHERE company_id = $1) AS products,
         (SELECT COUNT(*)::int FROM arrangements WHERE company_id = $1) AS arrangements,
         (SELECT COUNT(*)::int FROM events WHERE company_id = $1) AS sales,
         (SELECT COALESCE(SUM(sold_value), 0)::float FROM events WHERE company_id = $1) AS revenue,
         (SELECT COUNT(*)::int FROM quotes WHERE company_id = $1) AS quotes,
         (SELECT COUNT(*)::int FROM purchases WHERE company_id = $1) AS purchases,
         (SELECT COALESCE(SUM(total), 0)::float FROM purchases WHERE company_id = $1) AS purchases_total,
         (SELECT COUNT(*)::int FROM expenses WHERE company_id = $1) AS expenses,
         (SELECT COUNT(*)::int FROM events WHERE company_id = $1 AND created_at >= now() - interval '7 days') AS sales_last7,
         (SELECT COUNT(*)::int FROM events WHERE company_id = $1 AND created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days') AS sales_prev7`,
      [companyId],
    )) as [Record<string, number>];

    return {
      users: row.users,
      customers: row.customers,
      products: row.products,
      arrangements: row.arrangements,
      sales: row.sales,
      revenue: row.revenue,
      quotes: row.quotes,
      purchases: row.purchases,
      purchasesTotal: row.purchases_total,
      expenses: row.expenses,
      salesLast7: row.sales_last7,
      salesPrev7: row.sales_prev7,
    };
  }
}
