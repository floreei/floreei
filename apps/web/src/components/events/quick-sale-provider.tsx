"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QuickSaleDialog } from "@/components/events/quick-sale-dialog";

interface QuickSaleContextValue {
  /** Abre a venda rápida de qualquer lugar (bottom nav, Início, atalhos). */
  openSale: () => void;
}

const QuickSaleContext = createContext<QuickSaleContextValue | null>(null);

/**
 * Dono único do estado da Venda rápida no dashboard: a ação nº 1 do florista
 * precisa estar a um toque em qualquer tela ("o balcão manda").
 */
export function QuickSaleProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSale = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openSale }), [openSale]);

  return (
    <QuickSaleContext.Provider value={value}>
      {children}
      <QuickSaleDialog open={open} onOpenChange={setOpen} />
    </QuickSaleContext.Provider>
  );
}

export function useQuickSale(): QuickSaleContextValue {
  const ctx = useContext(QuickSaleContext);
  if (!ctx) {
    throw new Error("useQuickSale deve ser usado dentro de QuickSaleProvider");
  }
  return ctx;
}
