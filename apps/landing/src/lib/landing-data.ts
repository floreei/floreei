"use client";

import type { PlanOffer, PublicLanding } from "@sistema-flores/types";
import { PLAN_TIER_LIST } from "@sistema-flores/types";
import { useEffect, useState } from "react";
import { API_URL } from "./site";

/** Valores-padrão (semente dos planos) — usados se a API estiver fora do ar. */
export const FALLBACK_PLANS: PlanOffer[] = PLAN_TIER_LIST.map((t) => ({
  id: t.id,
  name: t.name,
  tagline: t.tagline,
  basePrice: t.basePrice,
  userPrice: t.userPrice,
  features: t.features,
}));

// Uma única chamada por visita, compartilhada entre as seções (planos e
// oferta de fundador) — é o único endpoint público de dados da API.
let cached: Promise<PublicLanding | null> | null = null;
function fetchLanding(): Promise<PublicLanding | null> {
  cached ??= fetch(`${API_URL}/billing/public-landing`)
    .then((res) => (res.ok ? (res.json() as Promise<PublicLanding>) : null))
    .catch(() => null);
  return cached;
}

/**
 * Dados vivos da landing: planos vigentes (com fallback local) e vagas de
 * fundador (`founder` fica null sem API — as seções escondem o contador).
 */
export function useLandingData(): {
  plans: PlanOffer[];
  founder: PublicLanding["founder"] | null;
} {
  const [data, setData] = useState<PublicLanding | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLanding().then((result) => {
      if (alive && result && Array.isArray(result.plans) && result.plans.length) {
        setData(result);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return {
    plans: data?.plans ?? FALLBACK_PLANS,
    founder: data?.founder ?? null,
  };
}
