"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Como o lojista vende — define o passo a passo do onboarding E quais canais
 * aparecem no menu lateral.
 * - RETAIL: venda direta ao consumidor (buquês).
 * - WHOLESALE: revenda de produto a outros lojistas (atacado).
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

interface BusinessFocusValue {
  /** `undefined` até hidratar; `null` quando ainda não escolheu. */
  focus: BusinessFocus | null | undefined;
  choose: (focus: BusinessFocus) => void;
  /** Volta ao estado "não escolhido" (reabre a pergunta) sem apagar do storage. */
  reset: () => void;
}

const BusinessFocusContext = createContext<BusinessFocusValue | null>(null);

/**
 * Fonte única do foco do negócio, compartilhada por menu, onboarding e topbar —
 * trocar em um lugar reflete em todos na hora (estado por componente não
 * sincronizava entre instâncias). Persiste no `localStorage` por empresa.
 */
export function BusinessFocusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const companyId = user?.companyId;
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

  const value = useMemo(
    () => ({ focus, choose, reset }),
    [focus, choose, reset],
  );

  return (
    <BusinessFocusContext.Provider value={value}>
      {children}
    </BusinessFocusContext.Provider>
  );
}

export function useBusinessFocus(): BusinessFocusValue {
  const ctx = useContext(BusinessFocusContext);
  if (!ctx) {
    throw new Error("useBusinessFocus precisa do BusinessFocusProvider");
  }
  return ctx;
}
