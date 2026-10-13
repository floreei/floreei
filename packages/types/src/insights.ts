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

/** Item (produto ou buquê) de um pedido, com as linhas do mesmo produto somadas. */
export interface PendingDeliveryItem {
  id: string;
  name: string;
  kind: "product" | "arrangement";
  quantity: number;
  unit: ProductUnit;
  /** Valor de venda somado (line_total) das linhas deste item no pedido. */
  value: number;
}

/**
 * Um pedido (venda) da visão de entregas. Cada venda vem separada — o mesmo
 * cliente com pedidos para dias diferentes aparece uma vez por pedido.
 */
export interface PendingDeliverySale {
  /** id da venda. */
  id: string;
  /** null = venda sem cliente. */
  customerId: string | null;
  customerName: string | null;
  /** Data da venda (AAAA-MM-DD). */
  date: string;
  /** Data de entrega combinada, ou null quando não informada (usa-se `date`). */
  deliveryDate: string | null;
  /** Valor de venda (sold_value) do pedido. */
  totalValue: number;
  /** Ordenado por quantidade (desc). */
  items: PendingDeliveryItem[];
}

/**
 * Consolidado de entregas no período filtrado. O mesmo formato serve às duas
 * visões: o que falta entregar (`pendingDeliveries`) e o que já foi entregue
 * (`delivered`).
 */
export interface PendingDeliveries {
  /** Vendas da visão: confirmadas/em andamento (pendentes) ou concluídas (entregues). */
  salesCount: number;
  /** Soma das quantidades de todos os itens da visão (unidades mistas). */
  totalQuantity: number;
  /** Valor de venda somado de todos os pedidos da visão. */
  totalValue: number;
  /**
   * Um por pedido, ordenado pela data efetiva (`deliveryDate ?? date`)
   * crescente, depois nome do cliente, depois id.
   */
  sales: PendingDeliverySale[];
}

/**
 * Insights práticos da tela de Vendas, no período filtrado. "Mais" mostra o
 * que puxa a receita; "parados/em risco" é o que vira ação (empurrar item
 * encalhado, reativar cliente sumido); "falta entregar" é a rota do dia e
 * "já entregue" é a conferência do que saiu.
 */
export interface SalesInsights {
  from: string;
  to: string;
  topItems: SoldItemRanking[];
  idleItems: IdleItem[];
  topCustomers: PartyRanking[];
  atRiskCustomers: AtRiskCustomer[];
  pendingDeliveries: PendingDeliveries;
  /** Vendas já entregues (DONE) no período, no mesmo formato das pendências. */
  delivered: PendingDeliveries;
}
