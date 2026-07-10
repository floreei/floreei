import type { PartyRanking } from "./report";

/** Item vendido (insumo avulso ou buquê) ranqueado por quantidade no período. */
export interface SoldItemRanking {
  /** id do produto ou do buquê. */
  id: string;
  name: string;
  kind: "product" | "arrangement";
  quantity: number;
  revenue: number;
}

/** Item ativo do catálogo sem nenhuma venda no período (encalhado). */
export interface IdleItem {
  id: string;
  name: string;
  kind: "product" | "arrangement";
  /** Última venda em qualquer período, ou null se nunca vendeu. */
  lastSoldAt: string | null;
}

/** Cliente que já comprou antes mas não no período (em risco de perder). */
export interface AtRiskCustomer {
  id: string;
  name: string;
  /** Última compra (anterior ao período filtrado). */
  lastPurchaseAt: string | null;
  /** Total histórico já comprado. */
  total: number;
}

/**
 * Insights práticos da tela de Vendas, no período filtrado. "Mais" mostra o
 * que puxa a receita; "parados/em risco" é o que vira ação (empurrar item
 * encalhado, reativar cliente sumido).
 */
export interface SalesInsights {
  from: string;
  to: string;
  topItems: SoldItemRanking[];
  idleItems: IdleItem[];
  topCustomers: PartyRanking[];
  atRiskCustomers: AtRiskCustomer[];
}
