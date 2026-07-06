import { z } from "zod";

/** Dias padrão do período gratuito, contados a partir do primeiro acesso. */
export const TRIAL_LENGTH_DAYS = 7;

/** Empresa "em risco": sem acessar há tantos dias (sinal de churn/abandono). */
export const AT_RISK_INACTIVE_DAYS = 7;

/** Plano da empresa (tenant). TRIAL = período gratuito; ACTIVE = liberada sem prazo. */
export const companyPlans = ["TRIAL", "ACTIVE"] as const;
export type CompanyPlan = (typeof companyPlans)[number];

/** Status efetivo de acesso (derivado de plano + suspensão + prazo do trial). */
export const companyAccessStatuses = [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "SUSPENDED",
] as const;
export type CompanyAccessStatus = (typeof companyAccessStatuses)[number];

/** Papel do gestor da plataforma. OWNER gerencia gestores; SUPPORT vê e age. */
export const platformAdminRoles = ["OWNER", "SUPPORT"] as const;
export type PlatformAdminRole = (typeof platformAdminRoles)[number];

/** Códigos de bloqueio devolvidos ao app do cliente quando o acesso é negado. */
export const ACCESS_DENIED_CODES = {
  SUSPENDED: "COMPANY_SUSPENDED",
  EXPIRED: "TRIAL_EXPIRED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
} as const;

/** Estado de acesso de uma empresa — entrada do resolvedor de status. */
export interface CompanyAccess {
  plan: CompanyPlan;
  suspended: boolean;
  /** Fim do período gratuito (ISO) — só relevante no plano TRIAL. */
  trialEndsAt: string | Date | null;
}

export interface ResolvedAccess {
  status: CompanyAccessStatus;
  /** Empresa pode usar o app do cliente? (ACTIVE ou TRIAL dentro do prazo) */
  allowed: boolean;
  /** Dias restantes do trial (arredondado p/ cima, >=0) quando TRIAL; senão null. */
  trialDaysLeft: number | null;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Resolve o status efetivo de acesso de uma empresa. Precedência:
 * SUSPENDED > ACTIVE (plano liberado) > TRIAL (dentro do prazo) > EXPIRED.
 * Função pura — usada no guard do cliente, nas métricas do console e no front.
 */
export function resolveCompanyAccess(
  access: CompanyAccess,
  now: Date = new Date(),
): ResolvedAccess {
  if (access.suspended) {
    return { status: "SUSPENDED", allowed: false, trialDaysLeft: null };
  }
  if (access.plan === "ACTIVE") {
    return { status: "ACTIVE", allowed: true, trialDaysLeft: null };
  }
  const ends = access.trialEndsAt ? new Date(access.trialEndsAt) : null;
  if (ends && now.getTime() <= ends.getTime()) {
    const daysLeft = Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / DAY_MS));
    return { status: "TRIAL", allowed: true, trialDaysLeft: daysLeft };
  }
  return { status: "EXPIRED", allowed: false, trialDaysLeft: 0 };
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
  metrics: CompanyMetrics;
  team: PlatformCompanyUser[];
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
