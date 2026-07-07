import type { Feature, PlanTier } from "@sistema-flores/types";
import { PLAN_TIER_LIST } from "@sistema-flores/types";

/** Nome e descrição (pt-BR) de cada módulo pago, para telas de plano/upgrade. */
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
};

/** Plano mais barato que inclui a feature (para a mensagem de upgrade). */
export function cheapestTierWith(feature: Feature): PlanTier | null {
  const tier = PLAN_TIER_LIST.find((t) => t.features.includes(feature));
  return tier?.id ?? null;
}
