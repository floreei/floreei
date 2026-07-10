import type { Event } from "./event";
import type { Quote } from "./quote";

/** Ponto da série mensal de receita/lucro (gráfico do dashboard). */
export interface RevenuePoint {
  month: string; // AAAA-MM
  revenue: number;
  profit: number;
}

/** Primeiros passos do onboarding (checklist ordenado no Início). */
export interface FirstSteps {
  hasCategory: boolean;
  hasProduct: boolean;
  hasCustomer: boolean;
  hasSale: boolean;
  /** Tem ao menos um buquê (arranjo) montado. */
  hasArrangement: boolean;
  /** Tem ao menos um fornecedor cadastrado. */
  hasSupplier: boolean;
  /** Registrou ao menos uma compra. */
  hasPurchase: boolean;
  /** Fez ao menos uma venda no varejo (venda direta). */
  hasRetailSale: boolean;
  /** Fez ao menos uma venda no atacado. */
  hasWholesaleSale: boolean;
  storeEnabled: boolean;
  hasTeammate: boolean;
}

/** Resumo consolidado exibido no dashboard. */
export interface DashboardSummary {
  month: string; // AAAA-MM de referência
  eventsThisMonth: number;
  revenueThisMonth: number;
  estimatedProfitThisMonth: number;
  pendingQuotes: number;
  accountsReceivable: number;
  upcomingEvents: Event[];
  recentQuotes: Quote[];
  revenueSeries: RevenuePoint[];
}
