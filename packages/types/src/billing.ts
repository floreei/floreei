import { z } from "zod";
import type { Feature, PlanTier } from "./entitlements";
import { ALL_FEATURES, planTiers } from "./entitlements";

/** Status da assinatura recorrente (espelha o preapproval do Mercado Pago). */
export const subscriptionStatuses = [
  "PENDING", // criada, aguardando o cliente autorizar no checkout do MP
  "AUTHORIZED", // ativa, cobrando todo mês
  "PAUSED", // pausada pelo MP (falhas de cobrança)
  "CANCELLED", // cancelada (pelo cliente ou pela plataforma)
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const subscribeSchema = z.object({
  tier: z.enum(planTiers),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

/** Oferta de plano como a página de assinatura exibe (preço já calculado). */
export interface PlanOffer {
  id: PlanTier;
  name: string;
  tagline: string;
  basePrice: number;
  /** Preço por usuário ativo (R$/mês). */
  userPrice: number;
  features: Feature[];
}

/**
 * Edição de um plano pelo console do gestor (nada é fixo no código): nome,
 * preços e features vigentes. Vale para novas contas e assinantes atuais
 * (preço novo entra na próxima cobrança).
 */
export const updatePlanDefinitionSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(40).optional(),
  tagline: z.string().trim().max(80).optional(),
  basePrice: z.coerce.number().min(0).max(100_000).optional(),
  userPrice: z.coerce.number().min(0).max(10_000).optional(),
  features: z.array(z.enum(ALL_FEATURES as [Feature, ...Feature[]])).optional(),
});
export type UpdatePlanDefinitionInput = z.infer<typeof updatePlanDefinitionSchema>;

/** Assinatura vigente, como o ERP a exibe. */
export interface SubscriptionView {
  id: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  /** Valor mensal vigente (base + usuários × R$16). */
  amount: number;
  /** Nº de usuários considerado no último cálculo do valor. */
  billedUsers: number;
  paymentFailedAt: string | null;
  /** Dias restantes da carência para regularizar; null sem pendência. */
  graceDaysLeft: number | null;
  /** Checkout do MP para retomar o pagamento — só quando `status = PENDING`. */
  initPoint: string | null;
  createdAt: string;
}

/**
 * O que a empresa fez durante o período gratuito — usado na tela de fim de
 * trial para vender com dados ("você registrou N vendas…") e recomendar plano.
 */
export interface TrialSummary {
  sales: number;
  revenue: number;
  quotes: number;
  products: number;
  customers: number;
  storeEnabled: boolean;
  recommendedTier: PlanTier;
}

/** Resposta de `GET /billing/subscription`. */
export interface BillingSummary {
  subscription: SubscriptionView | null;
  activeUsers: number;
}

/** Resposta de `GET /billing/plans`. */
export interface BillingPlans {
  plans: PlanOffer[];
  activeUsers: number;
  currentTier: PlanTier | null;
}

/** Resposta de `POST /billing/subscribe` — segue para o checkout do MP. */
export interface SubscribeResult {
  subscriptionId: string;
  /** URL de autorização da assinatura no Mercado Pago. */
  initPoint: string;
}

/** Vagas da oferta de fundador (escassez real na landing). */
export const FOUNDER_SLOTS = 10;

/**
 * Dados públicos da landing — o ÚNICO endpoint sem autenticação além do
 * webhook: só definições de plano e contagem de vagas, nada de empresas.
 */
export interface PublicLanding {
  plans: PlanOffer[];
  founder: {
    total: number;
    taken: number;
    remaining: number;
  };
}
