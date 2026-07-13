"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QuickSaleDialog } from "@/components/events/quick-sale-dialog";
import { SaleChannelChooser } from "@/components/events/sale-channel-chooser";
import { WholesaleSaleDialog } from "@/components/wholesale/wholesale-sale-dialog";
import { useAuth } from "@/lib/auth/auth-context";

interface QuickSaleContextValue {
  /** Abre a venda direta (varejo) de qualquer lugar. */
  openSale: () => void;
  /** Abre a venda no atacado (revenda em pacote fechado). */
  openWholesaleSale: () => void;
  /**
   * Entrada genérica de "Nova venda": com atacado habilitado, pergunta o canal;
   * sem atacado, vai direto para a venda direta.
   */
  openSaleChooser: () => void;
}

const QuickSaleContext = createContext<QuickSaleContextValue | null>(null);

/**
 * Dono único do estado das vendas rápidas no dashboard: a ação nº 1 do
 * florista precisa estar a um toque em qualquer tela ("o balcão manda").
 */
export function QuickSaleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const hasWholesale = (user?.access?.features ?? []).includes("WHOLESALE");

  const [open, setOpen] = useState(false);
  const [wholesaleOpen, setWholesaleOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);

  const openSale = useCallback(() => setOpen(true), []);
  const openWholesaleSale = useCallback(() => setWholesaleOpen(true), []);
  const openSaleChooser = useCallback(() => {
    // Sem atacado no plano/foco não há o que perguntar: abre a venda direta.
    if (hasWholesale) setChooserOpen(true);
    else setOpen(true);
  }, [hasWholesale]);

  const value = useMemo(
    () => ({ openSale, openWholesaleSale, openSaleChooser }),
    [openSale, openWholesaleSale, openSaleChooser],
  );

  return (
    <QuickSaleContext.Provider value={value}>
      {children}
      <SaleChannelChooser
        open={chooserOpen}
        onOpenChange={setChooserOpen}
        onPick={(channel) => {
          setChooserOpen(false);
          if (channel === "WHOLESALE") setWholesaleOpen(true);
          else setOpen(true);
        }}
      />
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
