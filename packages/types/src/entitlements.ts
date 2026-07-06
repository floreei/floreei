import type { CompanyAccessStatus } from "./platform";

/**
 * Features (módulos) que um plano pode liberar. O núcleo — início, clientes,
 * catálogo, empresa, equipe — está sempre disponível e não entra aqui.
 */
export const FEATURES = {
  SALES: "SALES", // venda direta / balcão / eventos + caixa
  QUOTES: "QUOTES", // orçamentos
  INVENTORY: "INVENTORY", // estoque, compras, fornecedores
  ARRANGEMENTS: "ARRANGEMENTS", // buquês com custeio (ficha técnica)
  FINANCE: "FINANCE", // financeiro completo (DRE, a receber/pagar, despesas)
  REPORTS: "REPORTS", // relatórios
  STORE: "STORE", // loja online
} as const;
export type Feature = (typeof FEATURES)[keyof typeof FEATURES];
export const ALL_FEATURES = Object.values(FEATURES) as Feature[];

/** Planos de preço (tiers). */
export const planTiers = ["ESSENCIAL", "LOJA", "COMPLETO"] as const;
export type PlanTier = (typeof planTiers)[number];

/** Preço por usuário ativo (R$/mês), igual em todos os planos. */
export const USER_PRICE = 16;

export interface PlanTierDef {
  id: PlanTier;
  name: string;
  /** Foco/persona do plano (marketing). */
  tagline: string;
  /** Preço-base mensal (R$) pelas features; usuários são cobrados à parte. */
  basePrice: number;
  features: Feature[];
}

export const PLAN_TIERS: Record<PlanTier, PlanTierDef> = {
  ESSENCIAL: {
    id: "ESSENCIAL",
    name: "Essencial",
    tagline: "Venda direta",
    basePrice: 79,
    features: [FEATURES.SALES, FEATURES.QUOTES],
  },
  LOJA: {
    id: "LOJA",
    name: "Loja",
    tagline: "Lojinha online",
    basePrice: 149,
    features: [
      FEATURES.SALES,
      FEATURES.QUOTES,
      FEATURES.STORE,
      FEATURES.INVENTORY,
      FEATURES.ARRANGEMENTS,
      FEATURES.FINANCE,
    ],
  },
  COMPLETO: {
    id: "COMPLETO",
    name: "Completo",
    tagline: "Varejista",
    basePrice: 229,
    features: [...ALL_FEATURES],
  },
};

export const PLAN_TIER_LIST: PlanTierDef[] = [
  PLAN_TIERS.ESSENCIAL,
  PLAN_TIERS.LOJA,
  PLAN_TIERS.COMPLETO,
];

/** Preço mensal do plano = base + (nº de usuários ativos) × R$16. */
export function planPrice(tier: PlanTier, activeUsers: number): number {
  return PLAN_TIERS[tier].basePrice + Math.max(0, activeUsers) * USER_PRICE;
}

/** Overrides por-empresa (backoffice): liga (true) / desliga (false) uma feature. */
export type FeatureOverrides = Partial<Record<Feature, boolean>>;

export interface CompanyEntitlements {
  tier: PlanTier | null;
  features: Feature[];
}

/**
 * Features efetivas de uma empresa.
 * - **TRIAL**: libera tudo (experimenta o produto inteiro → converte melhor).
 * - Senão: as features do tier, com os overrides do backoffice tendo precedência.
 * - Sem tier e fora do trial: nenhuma feature.
 */
export function resolveEntitlements(
  tier: PlanTier | null,
  overrides: FeatureOverrides | null | undefined,
  accessStatus: CompanyAccessStatus,
): Feature[] {
  if (accessStatus === "TRIAL") return [...ALL_FEATURES];
  const set = new Set<Feature>(tier ? PLAN_TIERS[tier].features : []);
  if (overrides) {
    for (const f of ALL_FEATURES) {
      if (overrides[f] === true) set.add(f);
      else if (overrides[f] === false) set.delete(f);
    }
  }
  return ALL_FEATURES.filter((f) => set.has(f));
}
