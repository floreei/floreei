"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Como o lojista vende — define o passo a passo do onboarding.
 * - RETAIL: venda direta ao consumidor (buquês).
 * - WHOLESALE: revenda de insumo a outros lojistas (atacado).
 * - BOTH: os dois.
 */
export type BusinessFocus = "RETAIL" | "WHOLESALE" | "BOTH";

/** Chave por empresa (não vaza entre contas no mesmo navegador). */
function focusKey(companyId: string): string {
  return `floreei:focus:${companyId}`;
}

function isFocus(value: unknown): value is BusinessFocus {
  return value === "RETAIL" || value === "WHOLESALE" || value === "BOTH";
}

export function getFocus(companyId: string): BusinessFocus | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(focusKey(companyId));
  return isFocus(raw) ? raw : null;
}

export function setFocus(companyId: string, focus: BusinessFocus): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(focusKey(companyId), focus);
}

/**
 * Lê/escreve o foco do negócio da empresa atual. `focus` é `undefined` até
 * hidratar (evita divergência SSR) e `null` quando o lojista ainda não escolheu.
 */
export function useBusinessFocus(companyId: string | undefined) {
  const [focus, setFocusState] = useState<BusinessFocus | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!companyId) return;
    setFocusState(getFocus(companyId));
  }, [companyId]);

  const choose = useCallback(
    (next: BusinessFocus) => {
      if (!companyId) return;
      setFocus(companyId, next);
      setFocusState(next);
    },
    [companyId],
  );

  const reset = useCallback(() => setFocusState(null), []);

  return { focus, choose, reset };
}
