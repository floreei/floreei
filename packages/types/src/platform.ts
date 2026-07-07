import { z } from "zod";
import type { SubscriptionStatus } from "./billing";
import type { Feature, FeatureOverrides, PlanTier } from "./entitlements";
import { ALL_FEATURES, planTiers } from "./entitlements";

/** Dias padrão do período gratuito, contados a partir do primeiro acesso. */
export const TRIAL_LENGTH_DAYS = 7;

/** Dias de carência para regularizar um pagamento que falhou (ou reassinar). */
export const PAYMENT_GRACE_DAYS = 5;

/** Empresa "em risco": sem acessar há tantos dias (sinal de churn/abandono). */
export const AT_RISK_INACTIVE_DAYS = 7;

/** Plano da empresa (tenant). TRIAL = período gratuito; ACTIVE = liberada sem prazo. */
export const companyPlans = ["TRIAL", "ACTIVE"] as const;
export type CompanyPlan = (typeof companyPlans)[number];

/** Status efetivo de acesso (plano + suspensão + assinatura + prazo do trial). */
export const companyAccessStatuses = [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "SUSPENDED",
  "PAYMENT_OVERDUE", // assinatura com pagamento pendente além da carência
] as const;
export type CompanyAccessStatus = (typeof companyAccessStatuses)[number];

/** Papel do gestor da plataforma. OWNER gerencia gestores; SUPPORT vê e age. */
export const platformAdminRoles = ["OWNER", "SUPPORT"] as const;
export type PlatformAdminRole = (typeof platformAdminRoles)[number];

/** Códigos de bloqueio devolvidos ao app do cliente quando o acesso é negado. */
export const ACCESS_DENIED_CODES = {
  SUSPENDED: "COMPANY_SUSPENDED",
  EXPIRED: "TRIAL_EXPIRED",
  PAYMENT_OVERDUE: "PAYMENT_OVERDUE",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
} as const;

/** Estado de acesso de uma empresa — entrada do resolvedor de status. */
export interface CompanyAccess {
  plan: CompanyPlan;
  suspended: boolean;
  /** Fim do período gratuito (ISO) — só relevante no plano TRIAL. */
  trialEndsAt: string | Date | null;
  /** Status da assinatura recorrente (denormalizado do billing); null sem assinatura. */
  subscriptionStatus?: SubscriptionStatus | null;
  /** Início da pendência de pagamento (falha de cobrança/cancelamento). */
  paymentFailedAt?: string | Date | null;
}

export interface ResolvedAccess {
  status: CompanyAccessStatus;
  /** Empresa pode usar o app do cliente? (ACTIVE ou TRIAL dentro do prazo) */
  allowed: boolean;
  /** Dias restantes do trial (arredondado p/ cima, >=0) quando TRIAL; senão null. */
  trialDaysLeft: number | null;
  /** Dias restantes da carência quando há pagamento pendente; senão null. */
  graceDaysLeft: number | null;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Resolve o status efetivo de acesso de uma empresa. Precedência:
 * SUSPENDED > ACTIVE (liberação manual) > assinatura (com carência de
 * PAYMENT_GRACE_DAYS quando há pagamento pendente) > TRIAL (dentro do prazo) >
 * EXPIRED. Função pura — usada no guard do cliente, no console e no front.
 */
export function resolveCompanyAccess(
  access: CompanyAccess,
  now: Date = new Date(),
): ResolvedAccess {
  const none = { trialDaysLeft: null, graceDaysLeft: null };
  if (access.suspended) {
    return { status: "SUSPENDED", allowed: false, ...none };
  }
  if (access.plan === "ACTIVE") {
    return { status: "ACTIVE", allowed: true, ...none };
  }

  // Assinatura recorrente. Quem cancela/pausa sempre ganha `paymentFailedAt`
  // (início da carência); AUTHORIZED sem pendência é acesso pleno.
  const sub = access.subscriptionStatus;
  const failedAt = access.paymentFailedAt
    ? new Date(access.paymentFailedAt)
    : null;
  if (sub === "AUTHORIZED" || ((sub === "PAUSED" || sub === "CANCELLED") && failedAt)) {
    if (!failedAt) {
      return { status: "ACTIVE", allowed: true, ...none };
    }
    const graceEnds = failedAt.getTime() + PAYMENT_GRACE_DAYS * DAY_MS;
    if (now.getTime() <= graceEnds) {
      const graceDaysLeft = Math.max(
        0,
        Math.ceil((graceEnds - now.getTime()) / DAY_MS),
      );
      return { status: "ACTIVE", allowed: true, trialDaysLeft: null, graceDaysLeft };
    }
    if (sub !== "CANCELLED") {
      return { status: "PAYMENT_OVERDUE", allowed: false, ...none };
    }
    // Cancelada e fora da carência: cai para trial/EXPIRED (reassinar).
  }

  const ends = access.trialEndsAt ? new Date(access.trialEndsAt) : null;
  if (ends && now.getTime() <= ends.getTime()) {
    const daysLeft = Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / DAY_MS));
    return {
      status: "TRIAL",
      allowed: true,
      trialDaysLeft: daysLeft,
      graceDaysLeft: null,
    };
  }
  return { status: "EXPIRED", allowed: false, trialDaysLeft: 0, graceDaysLeft: null };
}

/** Dias inteiros desde o último acesso (`lastSeenAt`); null se nunca acessou. */
export function daysSince(
  moment: string | Date | null,
  now: Date = new Date(),
): number | null {
  if (!moment) return null;
  const then = new Date(moment).getTime();
  return Math.max(0, Math.floor((now.getTime() - then) / DAY_MS));
}

// ---------------------------------------------------------------------------
// Ações do console (payloads validados)
// ---------------------------------------------------------------------------

export const extendTrialSchema = z.object({
  days: z.coerce.number().int().min(1).max(365),
});
export type ExtendTrialInput = z.infer<typeof extendTrialSchema>;

export const invitePlatformAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  name: z.string().trim().min(2, "Informe o nome").max(160),
  role: z.enum(platformAdminRoles).default("SUPPORT"),
});
export type InvitePlatformAdminInput = z.infer<typeof invitePlatformAdminSchema>;

/** Plano + overrides de feature de uma empresa, definidos pelo gestor. */
export const updateEntitlementsSchema = z.object({
  /** Plano da empresa; null limpa (volta a depender de trial/assinatura). */
  tier: z.enum(planTiers).nullable().optional(),
  /** Overrides por feature (true liga, false desliga; ausente herda do plano). */
  featureOverrides: z
    .record(z.enum(ALL_FEATURES as [Feature, ...Feature[]]), z.boolean())
    .optional(),
  /** Marca/desmarca a empresa como fundadora (fechamentos por WhatsApp). */
  founder: z.boolean().optional(),
});
export type UpdateEntitlementsInput = z.infer<typeof updateEntitlementsSchema>;

export const companiesQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(companyAccessStatuses).optional(),
  risk: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === "true" || v === true),
  sort: z.enum(["recent", "lastSeen", "revenue", "name"]).default("lastSeen"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type CompaniesQuery = z.infer<typeof companiesQuerySchema>;

// ---------------------------------------------------------------------------
// Respostas (DTOs de leitura consumidos pelo console)
// ---------------------------------------------------------------------------

/** Métricas de uso e volume de uma empresa. */
export interface CompanyMetrics {
  users: number; // usuários ativos
  customers: number;
  products: number;
  arrangements: number; // buquês cadastrados
  sales: number; // nº de vendas (eventos)
  revenue: number; // Σ do valor vendido
  quotes: number;
  purchases: number;
  purchasesTotal: number; // Σ do total comprado
  expenses: number;
  salesLast7: number; // nº de vendas nos últimos 7 dias
  salesPrev7: number; // nº de vendas nos 7 dias anteriores (tendência)
}

/** Empresa na listagem do console (resumo + sinais de saúde). */
export interface CompanyListItem {
  id: string;
  name: string;
  status: CompanyAccessStatus;
  plan: CompanyPlan;
  tier: PlanTier | null;
  trialDaysLeft: number | null;
  createdAt: string;
  firstAccessAt: string | null;
  lastSeenAt: string | null;
  daysInactive: number | null;
  atRisk: boolean;
  users: number;
  sales: number;
  revenue: number;
}

export interface PlatformCompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

/** Assinatura da empresa como o console a exibe. */
export interface CompanySubscriptionInfo {
  status: SubscriptionStatus;
  tier: PlanTier;
  amount: number;
  billedUsers: number;
  paymentFailedAt: string | null;
}

/** Detalhe completo de uma empresa no console. */
export interface CompanyDetail {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  firstAccessAt: string | null;
  lastSeenAt: string | null;
  trialEndsAt: string | null;
  plan: CompanyPlan;
  status: CompanyAccessStatus;
  trialDaysLeft: number | null;
  daysInactive: number | null;
  atRisk: boolean;
  tier: PlanTier | null;
  featureOverrides: FeatureOverrides;
  /** Uma das 10 vagas de fundador (consumida na 1ª assinatura ou pelo gestor). */
  founder: boolean;
  subscription: CompanySubscriptionInfo | null;
  metrics: CompanyMetrics;
  team: PlatformCompanyUser[];
}

/** Empresa como alvo de abordagem comercial (listas acionáveis do console). */
export interface SalesLead {
  id: string;
  name: string;
  phone: string | null;
}

/** Bloco de vendas/receita do console (o dinheiro do funil). */
export interface SalesOverview {
  /** Receita recorrente mensal: Σ do valor das assinaturas AUTHORIZED. */
  mrr: number;
  subscribers: number;
  byTier: { tier: PlanTier; count: number }[];
  /** Trials que vencem em ≤3 dias — hora de chamar no WhatsApp. */
  trialsEndingSoon: (SalesLead & { trialDaysLeft: number })[];
  /** Clicou em assinar e não concluiu o pagamento no MP (1h–14d atrás). */
  pendingCheckouts: (SalesLead & { tier: PlanTier; createdAt: string })[];
  /** Assinantes com pagamento pendente (dentro ou fora da carência). */
  overdue: (SalesLead & { graceDaysLeft: number | null })[];
}

/** KPIs da visão geral (dashboard do console). */
export interface PlatformOverview {
  totals: {
    companies: number;
    active: number;
    trial: number;
    expired: number;
    suspended: number;
  };
  newLast7: number;
  newLast30: number;
  atRisk: number;
  activeLast7: number; // empresas que acessaram nos últimos 7 dias
  totalRevenue: number; // receita total processada na plataforma
  totalSales: number;
  sales: SalesOverview;
}

/** Gestor da plataforma como o console o exibe. */
export interface PlatformAdminView {
  id: string;
  email: string;
  name: string;
  role: PlatformAdminRole;
  active: boolean;
  createdAt: string;
}

/** Sessão do gestor autenticado (`GET /admin/me`). */
export interface PlatformSession {
  email: string;
  name: string;
  role: PlatformAdminRole;
}

/** Tipos de notificação do console (extensível: pagamento, churn, etc.). */
export const platformNotificationTypes = ["NEW_COMPANY"] as const;
export type PlatformNotificationType =
  (typeof platformNotificationTypes)[number];

/** Notificação como o console a exibe. */
export interface PlatformNotification {
  id: string;
  type: PlatformNotificationType;
  title: string;
  body: string;
  companyId: string | null;
  read: boolean;
  createdAt: string;
}

/** Resposta de `GET /admin/notifications`. */
export interface PlatformNotificationsResult {
  items: PlatformNotification[];
  unread: number;
}
