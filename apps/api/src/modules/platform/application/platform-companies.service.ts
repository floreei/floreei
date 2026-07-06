import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  AT_RISK_INACTIVE_DAYS,
  type CompaniesQuery,
  type CompanyDetail,
  type CompanyListItem,
  type CompanyMetrics,
  type Paginated,
  type PlatformCompanyUser,
  type PlatformOverview,
  daysSince,
  resolveCompanyAccess,
} from "@sistema-flores/types";
import { DataSource, Repository } from "typeorm";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";
import { UserEntity } from "../../users/infrastructure/user.entity";

const DAY_MS = 24 * 60 * 60 * 1000;

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** Estado de saúde derivado (status de acesso + inatividade + risco). */
function health(c: CompanyEntity, now: Date) {
  const resolved = resolveCompanyAccess(
    { plan: c.plan, suspended: c.suspended, trialEndsAt: c.trialEndsAt },
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
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
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
      else if (resolved.status === "EXPIRED") totals.expired += 1;
      else if (resolved.status === "SUSPENDED") totals.suspended += 1;
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

  // -------------------------------------------------------------------------
  // Internos
  // -------------------------------------------------------------------------

  private async load(id: string): Promise<CompanyEntity> {
    const company = await this.companies.findOne({ where: { id } });
    if (!company) throw new NotFoundException("Empresa não encontrada.");
    return company;
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
