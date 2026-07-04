import type { Event } from "./event";
import type { Quote } from "./quote";

/** Ponto da série mensal de receita/lucro (gráfico do dashboard). */
export interface RevenuePoint {
  month: string; // AAAA-MM
  revenue: number;
  profit: number;
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
