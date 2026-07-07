import type { Feature, PlanTier } from "@sistema-flores/types";
import { PLAN_TIER_LIST } from "@sistema-flores/types";

export { FEATURE_INFO } from "@sistema-flores/types";

/** Plano mais barato que inclui a feature (para a mensagem de upgrade). */
export function cheapestTierWith(feature: Feature): PlanTier | null {
  const tier = PLAN_TIER_LIST.find((t) => t.features.includes(feature));
  return tier?.id ?? null;
}
