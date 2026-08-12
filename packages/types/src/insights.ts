import type { ProductUnit } from "./enums";
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

/** Item (produto ou buquê) pendente de entrega, com quantidade somada. */
export interface PendingDeliveryItem {
  id: string;
  name: string;
  kind: "product" | "arrangement";
  quantity: number;
  unit: ProductUnit;
  /** Valor de venda somado (line_total) das linhas pendentes deste item. */
  value: number;
}

/** Cliente com vendas a entregar no período (null = venda sem cliente). */
export interface PendingDeliveryCustomer {
  id: string | null;
  name: string | null;
  salesCount: number;
  /** Soma do valor de venda (sold_value) dos pedidos pendentes do cliente. */
  totalValue: number;
  items: PendingDeliveryItem[];
}

/** Consolidado do que falta entregar no período filtrado. */
export interface PendingDeliveries {
  /** Vendas confirmadas/em andamento (não entregues, não canceladas). */
  salesCount: number;
  /** Soma das quantidades de todos os itens pendentes (unidades mistas). */
  totalQuantity: number;
  /** Valor de venda somado de todos os pedidos pendentes. */
  totalValue: number;
  /** Ordenado por quantidade pendente (desc). */
  customers: PendingDeliveryCustomer[];
}

/**
 * Insights práticos da tela de Vendas, no período filtrado. "Mais" mostra o
 * que puxa a receita; "parados/em risco" é o que vira ação (empurrar item
 * encalhado, reativar cliente sumido); "falta entregar" é a rota do dia.
 */
export interface SalesInsights {
  from: string;
  to: string;
  topItems: SoldItemRanking[];
  idleItems: IdleItem[];
  topCustomers: PartyRanking[];
  atRiskCustomers: AtRiskCustomer[];
  pendingDeliveries: PendingDeliveries;
}
