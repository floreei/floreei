"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QuickSaleDialog } from "@/components/events/quick-sale-dialog";
import { WholesaleSaleDialog } from "@/components/wholesale/wholesale-sale-dialog";

interface QuickSaleContextValue {
  /** Abre a venda direta (varejo) de qualquer lugar. */
  openSale: () => void;
  /** Abre a venda no atacado (revenda em pacote fechado). */
  openWholesaleSale: () => void;
}

const QuickSaleContext = createContext<QuickSaleContextValue | null>(null);

/**
 * Dono único do estado das vendas rápidas no dashboard: a ação nº 1 do
 * florista precisa estar a um toque em qualquer tela ("o balcão manda").
 */
export function QuickSaleProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [wholesaleOpen, setWholesaleOpen] = useState(false);
  const openSale = useCallback(() => setOpen(true), []);
  const openWholesaleSale = useCallback(() => setWholesaleOpen(true), []);
  const value = useMemo(
    () => ({ openSale, openWholesaleSale }),
    [openSale, openWholesaleSale],
  );

  return (
    <QuickSaleContext.Provider value={value}>
      {children}
      <QuickSaleDialog open={open} onOpenChange={setOpen} />
      <WholesaleSaleDialog open={wholesaleOpen} onOpenChange={setWholesaleOpen} />
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
