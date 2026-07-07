import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type {
  BillingPlans,
  BillingSummary,
  PlanTier,
  PublicLanding,
  SubscribeResult,
  SubscriptionStatus,
  SubscriptionView,
  TrialSummary,
} from "@sistema-flores/types";
import {
  FOUNDER_SLOTS,
  PAYMENT_GRACE_DAYS,
  planPrice,
} from "@sistema-flores/types";
import { DataSource, In, Repository } from "typeorm";
import { TenantContextService } from "../../../common/tenant/tenant-context.service";
import { CompanyEntity } from "../../companies/infrastructure/company.entity";
import { PlanDefinitionsService } from "../../plans/plan-definitions.service";
import { UserEntity } from "../../users/infrastructure/user.entity";
import { SubscriptionEntity } from "../infrastructure/subscription.entity";
import {
  MercadoPagoBillingClient,
  type MpPreapprovalStatus,
} from "../mercadopago-billing.client";

const MP_STATUS: Record<MpPreapprovalStatus, SubscriptionStatus> = {
  pending: "PENDING",
  authorized: "AUTHORIZED",
  paused: "PAUSED",
  cancelled: "CANCELLED",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Assinatura da plataforma: cria/atualiza o preapproval no Mercado Pago e
 * mantém o espelho local (`subscriptions` + campos denormalizados da empresa)
 * que o guard de acesso consome.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptions: Repository<SubscriptionEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly tenant: TenantContextService,
    private readonly mp: MercadoPagoBillingClient,
    private readonly planDefs: PlanDefinitionsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Dados públicos da landing — o único endpoint aberto além do webhook.
   * Devolve SOMENTE definições de plano e contagem de vagas de fundador;
   * nenhum dado de empresa/usuário sai daqui.
   */
  async publicLanding(): Promise<PublicLanding> {
    const [defs, taken] = await Promise.all([
      this.planDefs.list(),
      this.companies.count({ where: { founder: true } }),
    ]);
    return {
      plans: defs.map((d) => this.planDefs.toOffer(d)),
      founder: {
        total: FOUNDER_SLOTS,
        taken: Math.min(taken, FOUNDER_SLOTS),
        remaining: Math.max(0, FOUNDER_SLOTS - taken),
      },
    };
  }

  /**
   * O que a empresa fez durante o trial + plano recomendado, para a tela de
   * fim de trial vender com dados. Heurística: usou a loja online → precisa de
   * STORE; usou compras/despesas/buquês → precisa de estoque+financeiro; os
   * dois perfis → COMPLETO; um → LOJA; nenhum → ESSENCIAL.
   */
  async trialSummary(): Promise<TrialSummary> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const company = await this.companyById(companyId);
    const [row] = (await this.dataSource.query(
      `SELECT
         (SELECT COUNT(*)::int FROM events WHERE company_id = $1) AS sales,
         (SELECT COALESCE(SUM(sold_value), 0)::float FROM events WHERE company_id = $1) AS revenue,
         (SELECT COUNT(*)::int FROM quotes WHERE company_id = $1) AS quotes,
         (SELECT COUNT(*)::int FROM products WHERE company_id = $1) AS products,
         (SELECT COUNT(*)::int FROM customers WHERE company_id = $1) AS customers,
         (SELECT COUNT(*)::int FROM purchases WHERE company_id = $1) AS purchases,
         (SELECT COUNT(*)::int FROM expenses WHERE company_id = $1) AS expenses,
         (SELECT COUNT(*)::int FROM arrangements WHERE company_id = $1) AS arrangements,
         (SELECT COUNT(*)::int FROM store_orders WHERE company_id = $1) AS store_orders`,
      [companyId],
    )) as [Record<string, number>];

    const usedStore = company.storeEnabled || row.store_orders > 0;
    const usedOps =
      row.purchases > 0 || row.expenses > 0 || row.arrangements > 0;
    const recommendedTier =
      usedStore && usedOps ? "COMPLETO" : usedStore || usedOps ? "LOJA" : "ESSENCIAL";

    return {
      sales: row.sales,
      revenue: row.revenue,
      quotes: row.quotes,
      products: row.products,
      customers: row.customers,
      storeEnabled: company.storeEnabled,
      recommendedTier,
    };
  }

  /** Planos vigentes (definidos no console) com o contexto da empresa atual. */
  async plans(): Promise<BillingPlans> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const [company, activeUsers, defs] = await Promise.all([
      this.companyById(companyId),
      this.activeUsers(companyId),
      this.planDefs.list(),
    ]);
    return {
      plans: defs.map((d) => this.planDefs.toOffer(d)),
      activeUsers,
      currentTier: company.tier,
    };
  }

  /** Assinatura vigente da empresa atual. */
  async summary(): Promise<BillingSummary> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const [current, activeUsers] = await Promise.all([
      this.currentSubscription(companyId),
      this.activeUsers(companyId),
    ]);
    return {
      subscription: current ? this.toView(current) : null,
      activeUsers,
    };
  }

  /** Cria a assinatura no MP e devolve o checkout (`initPoint`). */
  async subscribe(tier: PlanTier, payerEmail: string): Promise<SubscribeResult> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const current = await this.currentSubscription(companyId);
    if (current && current.status !== "PENDING") {
      throw new BadRequestException(
        "Sua empresa já tem uma assinatura. Use a troca de plano.",
      );
    }

    const [company, activeUsers, def] = await Promise.all([
      this.companyById(companyId),
      this.activeUsers(companyId),
      this.planDefs.get(tier),
    ]);
    const amount = planPrice(def, activeUsers);

    const preapproval = await this.mp.createPreapproval({
      reason: `Floreei — plano ${def.name} (${company.name})`,
      amount,
      externalReference: companyId,
      payerEmail,
      backUrl: `${this.webUrl()}/plano`,
    });
    if (!preapproval.initPoint) {
      throw new BadRequestException(
        "Não foi possível iniciar a assinatura. Tente novamente.",
      );
    }

    const row = await this.subscriptions.save(
      this.subscriptions.create({
        companyId,
        tier,
        mpPreapprovalId: preapproval.id,
        mpInitPoint: preapproval.initPoint,
        status: "PENDING",
        amount,
        billedUsers: activeUsers,
        paymentFailedAt: null,
      }),
    );
    return { subscriptionId: row.id, initPoint: preapproval.initPoint };
  }

  /** Troca o plano: features mudam na hora; o novo valor vale no próximo ciclo. */
  async changePlan(tier: PlanTier): Promise<SubscriptionView> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const current = await this.currentSubscription(companyId);
    if (!current || current.status !== "AUTHORIZED") {
      throw new BadRequestException(
        "Sua empresa não tem uma assinatura ativa para trocar de plano.",
      );
    }
    if (current.tier === tier) {
      throw new BadRequestException("A empresa já está neste plano.");
    }

    const [activeUsers, def] = await Promise.all([
      this.activeUsers(companyId),
      this.planDefs.get(tier),
    ]);
    const amount = planPrice(def, activeUsers);
    await this.mp.updatePreapprovalAmount(current.mpPreapprovalId, amount);

    current.tier = tier;
    current.amount = amount;
    current.billedUsers = activeUsers;
    const saved = await this.subscriptions.save(current);
    await this.companies.update({ id: companyId }, { tier });
    return this.toView(saved);
  }

  /** Cancela a assinatura; o acesso segue pela carência de 5 dias. */
  async cancel(): Promise<void> {
    const companyId = this.tenant.getCompanyIdOrThrow();
    const current = await this.currentSubscription(companyId);
    if (!current) {
      throw new NotFoundException("Sua empresa não tem assinatura para cancelar.");
    }
    await this.mp.cancelPreapproval(current.mpPreapprovalId);
    await this.applyStatus(current, "CANCELLED");
  }

  /**
   * Recalcula o valor mensal quando muda o nº de usuários ativos. Falha do MP
   * não bloqueia a operação de equipe — loga e o próximo sync corrige.
   */
  async syncUserCount(companyId: string): Promise<void> {
    try {
      const current = await this.currentSubscription(companyId);
      if (!current || current.status !== "AUTHORIZED") return;
      const [activeUsers, def] = await Promise.all([
        this.activeUsers(companyId),
        this.planDefs.get(current.tier),
      ]);
      const amount = planPrice(def, activeUsers);
      if (amount === current.amount && activeUsers === current.billedUsers) {
        return;
      }
      await this.mp.updatePreapprovalAmount(current.mpPreapprovalId, amount);
      await this.subscriptions.update(
        { id: current.id },
        { amount, billedUsers: activeUsers },
      );
    } catch (error) {
      this.logger.error(
        `Falha ao sincronizar valor da assinatura da empresa ${companyId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Reaplica o preço vigente do plano a todas as assinaturas em vigor do tier —
   * chamado quando o gestor edita o plano no console. O novo valor entra na
   * próxima cobrança de cada assinante; falhas são logadas por assinatura.
   */
  async resyncTierAmounts(tier: PlanTier): Promise<void> {
    const def = await this.planDefs.get(tier);
    const rows = await this.subscriptions.find({
      where: { tier, status: In(["AUTHORIZED", "PAUSED"]) },
    });
    for (const row of rows) {
      try {
        const activeUsers = await this.activeUsers(row.companyId);
        const amount = planPrice(def, activeUsers);
        if (amount === row.amount && activeUsers === row.billedUsers) continue;
        await this.mp.updatePreapprovalAmount(row.mpPreapprovalId, amount);
        await this.subscriptions.update(
          { id: row.id },
          { amount, billedUsers: activeUsers },
        );
      } catch (error) {
        this.logger.error(
          `Falha ao reaplicar preço do plano ${tier} na assinatura ${row.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  /** Mudança de status do preapproval (autorizou, pausou, cancelou…). */
  async handlePreapprovalEvent(preapprovalId: string): Promise<void> {
    const preapproval = await this.mp.getPreapproval(preapprovalId);
    if (!preapproval) return;
    const row = await this.subscriptions.findOne({
      where: { mpPreapprovalId: preapprovalId },
    });
    if (!row) return;
    await this.applyStatus(row, MP_STATUS[preapproval.status]);
  }

  /** Resultado da cobrança recorrente (aprovada limpa a pendência; rejeitada abre). */
  async handleAuthorizedPaymentEvent(paymentId: string): Promise<void> {
    const payment = await this.mp.getAuthorizedPayment(paymentId);
    if (!payment?.preapprovalId) return;
    const row = await this.subscriptions.findOne({
      where: { mpPreapprovalId: payment.preapprovalId },
    });
    if (!row) return;

    if (payment.paymentStatus === "approved") {
      await this.setPaymentFailure(row, null);
    } else if (
      payment.paymentStatus === "rejected" ||
      payment.paymentStatus === "cancelled"
    ) {
      await this.setPaymentFailure(row, row.paymentFailedAt ?? new Date());
    }
  }

  // ── Internos ──────────────────────────────────────────────────────────────

  /**
   * Aplica um novo status à assinatura e denormaliza na empresa. Pausa e
   * cancelamento abrem a carência (`paymentFailedAt`); autorização fecha e
   * também grava o tier contratado na empresa.
   */
  private async applyStatus(
    row: SubscriptionEntity,
    status: SubscriptionStatus,
  ): Promise<void> {
    row.status = status;
    if (status === "AUTHORIZED") {
      row.paymentFailedAt = null;
    } else if (
      (status === "PAUSED" || status === "CANCELLED") &&
      !row.paymentFailedAt
    ) {
      row.paymentFailedAt = new Date();
    }
    await this.subscriptions.save(row);

    const patch: Partial<CompanyEntity> = {
      subscriptionStatus: status,
      paymentFailedAt: row.paymentFailedAt,
    };
    if (status === "AUTHORIZED") {
      patch.tier = row.tier;
      await this.claimFounderSlot(row.companyId);
    }
    await this.companies.update({ id: row.companyId }, patch);
  }

  /**
   * Consome uma vaga de fundador na primeira assinatura autorizada, enquanto
   * houver vaga. A marca é permanente (cancelar não devolve); o gestor também
   * pode marcar/desmarcar pelo console.
   */
  private async claimFounderSlot(companyId: string): Promise<void> {
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company || company.founder) return;
    const taken = await this.companies.count({ where: { founder: true } });
    if (taken >= FOUNDER_SLOTS) return;
    await this.companies.update({ id: companyId }, { founder: true });
  }

  private async setPaymentFailure(
    row: SubscriptionEntity,
    failedAt: Date | null,
  ): Promise<void> {
    if (row.paymentFailedAt?.getTime() === failedAt?.getTime()) return;
    await this.subscriptions.update({ id: row.id }, { paymentFailedAt: failedAt });
    await this.companies.update(
      { id: row.companyId },
      { paymentFailedAt: failedAt },
    );
  }

  /** Assinatura vigente: a mais recente em vigor; senão a mais recente pendente. */
  private async currentSubscription(
    companyId: string,
  ): Promise<SubscriptionEntity | null> {
    const inEffect = await this.subscriptions.findOne({
      where: { companyId, status: In(["AUTHORIZED", "PAUSED"]) },
      order: { createdAt: "DESC" },
    });
    if (inEffect) return inEffect;
    return this.subscriptions.findOne({
      where: { companyId, status: "PENDING" },
      order: { createdAt: "DESC" },
    });
  }

  private async companyById(companyId: string): Promise<CompanyEntity> {
    const company = await this.companies.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Empresa não encontrada.");
    return company;
  }

  private activeUsers(companyId: string): Promise<number> {
    return this.users.count({ where: { companyId, active: true } });
  }

  private toView(row: SubscriptionEntity): SubscriptionView {
    const graceDaysLeft = row.paymentFailedAt
      ? Math.max(
          0,
          Math.ceil(
            (row.paymentFailedAt.getTime() +
              PAYMENT_GRACE_DAYS * DAY_MS -
              Date.now()) /
              DAY_MS,
          ),
        )
      : null;
    return {
      id: row.id,
      tier: row.tier,
      status: row.status,
      amount: row.amount,
      billedUsers: row.billedUsers,
      paymentFailedAt: row.paymentFailedAt
        ? row.paymentFailedAt.toISOString()
        : null,
      graceDaysLeft,
      initPoint: row.status === "PENDING" ? row.mpInitPoint : null,
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : row.createdAt,
    };
  }

  private webUrl(): string {
    return process.env.WEB_APP_URL ?? "http://localhost:3000";
  }
}
