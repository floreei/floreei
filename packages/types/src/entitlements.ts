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
  WHOLESALE: "WHOLESALE", // venda no atacado (revenda em pacote fechado)
  INVOICING: "INVOICING", // emissão de nota fiscal (NFC-e/NF-e) por venda
} as const;
export type Feature = (typeof FEATURES)[keyof typeof FEATURES];
export const ALL_FEATURES = Object.values(FEATURES) as Feature[];

/** Nome e descrição (pt-BR) de cada módulo, para telas de plano/upgrade. */
export const FEATURE_INFO: Record<Feature, { label: string; description: string }> = {
  SALES: {
    label: "Vendas e caixa",
    description: "Venda direta, eventos e controle de caixa do dia a dia.",
  },
  QUOTES: {
    label: "Orçamentos",
    description: "Monte orçamentos e transforme em venda com um clique.",
  },
  INVENTORY: {
    label: "Estoque e compras",
    description: "Compras de fornecedores, entradas e baixas de estoque.",
  },
  ARRANGEMENTS: {
    label: "Buquês com custeio",
    description: "Ficha técnica dos buquês com custo e margem calculados.",
  },
  FINANCE: {
    label: "Financeiro completo",
    description: "Contas a receber e a pagar, despesas e DRE.",
  },
  REPORTS: {
    label: "Relatórios",
    description: "Relatórios de vendas, produtos e desempenho.",
  },
  STORE: {
    label: "Loja online",
    description: "Sua lojinha na internet com pagamento pelo Mercado Pago.",
  },
  WHOLESALE: {
    label: "Venda no atacado",
    description: "Revenda de insumos em pacote fechado para outros lojistas.",
  },
  INVOICING: {
    label: "Nota fiscal",
    description: "Emissão de NFC-e (varejo) e NF-e (atacado) direto da venda.",
  },
};

/** Planos de preço (tiers). */
export const planTiers = ["ESSENCIAL", "LOJA", "COMPLETO"] as const;
export type PlanTier = (typeof planTiers)[number];

/** Preço padrão por usuário ADICIONAL (R$/mês) — o 1º usuário já está na base. */
export const USER_PRICE = 16;

export interface PlanTierDef {
  id: PlanTier;
  name: string;
  /** Foco/persona do plano (marketing). */
  tagline: string;
  /** Preço-base mensal (R$), já incluindo 1 usuário. */
  basePrice: number;
  /** Preço mensal por usuário ADICIONAL (a partir do 2º). */
  userPrice: number;
  features: Feature[];
}

/**
 * Definições-padrão dos planos. São a SEMENTE (migração) e o fallback — as
 * definições vigentes moram no banco (`plan_definitions`) e são editáveis pelo
 * console do gestor (preço, preço por usuário e features).
 */
export const PLAN_TIERS: Record<PlanTier, PlanTierDef> = {
  ESSENCIAL: {
    id: "ESSENCIAL",
    name: "Essencial",
    tagline: "Venda direta",
    basePrice: 79,
    userPrice: USER_PRICE,
    features: [FEATURES.SALES, FEATURES.QUOTES],
  },
  LOJA: {
    id: "LOJA",
    name: "Loja",
    tagline: "Lojinha online",
    basePrice: 149,
    userPrice: USER_PRICE,
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
    userPrice: USER_PRICE,
    features: [...ALL_FEATURES],
  },
};

export const PLAN_TIER_LIST: PlanTierDef[] = [
  PLAN_TIERS.ESSENCIAL,
  PLAN_TIERS.LOJA,
  PLAN_TIERS.COMPLETO,
];

/**
 * Preço mensal = base (já com 1 usuário) + usuários ADICIONAIS × preço/usuário.
 * Ex.: base 79 → 1 usuário 79; 2 usuários 95; 3 usuários 111.
 */
export function planPrice(
  def: Pick<PlanTierDef, "basePrice" | "userPrice">,
  activeUsers: number,
): number {
  return def.basePrice + Math.max(0, activeUsers - 1) * def.userPrice;
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
 * - Senão: as features do plano vigente (vindas do banco), com os overrides do
 *   backoffice tendo precedência.
 * - Sem plano e fora do trial: nenhuma feature.
 */
export function resolveEntitlements(
  tierFeatures: readonly Feature[] | null | undefined,
  overrides: FeatureOverrides | null | undefined,
  accessStatus: CompanyAccessStatus,
): Feature[] {
  if (accessStatus === "TRIAL") return [...ALL_FEATURES];
  const set = new Set<Feature>(tierFeatures ?? []);
  if (overrides) {
    for (const f of ALL_FEATURES) {
      if (overrides[f] === true) set.add(f);
      else if (overrides[f] === false) set.delete(f);
    }
  }
  return ALL_FEATURES.filter((f) => set.has(f));
}
