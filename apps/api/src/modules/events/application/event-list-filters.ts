import type { InsightsQuery } from "@sistema-flores/types";
import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";

const pad = (n: number) => String(n).padStart(2, "0");

/** Filtros da listagem de eventos com o período já resolvido (from/to sempre presentes). */
export type EventListFilters = Omit<InsightsQuery, "from" | "to"> & {
  from: string;
  to: string;
};

/**
 * Início/fim do mês corrente quando `from`/`to` não vierem na query. Usado
 * pelos endpoints que agregam eventos por período (insights, resultado do
 * período) para cair num intervalo padrão sensato.
 */
export function defaultMonthRange(from?: string, to?: string): { from: string; to: string } {
  const now = new Date();
  return {
    from: from ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    to:
      to ??
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
      )}`,
  };
}

/**
 * Filtros da listagem aplicados a uma query com alias `event` (e `customer`
 * joinado — necessário para a busca). Mesmas cláusulas do
 * EventRepository.search. `delivered` pode ser ignorado quando a query já
 * fixa o status (ex.: seção "falta entregar").
 *
 * Compartilhado entre SalesInsightsService e PeriodResultService para não
 * duplicar as mesmas cláusulas em cada consumidor.
 */
export function applyEventListFilters(
  qb: SelectQueryBuilder<ObjectLiteral>,
  f: EventListFilters,
  opts: { skipDelivered?: boolean } = {},
): void {
  if (f.channel) qb.andWhere("event.channel = :channel", { channel: f.channel });
  if (f.type) qb.andWhere("event.type = :type", { type: f.type });
  if (f.paymentStatus === "paid") {
    qb.andWhere("event.received_value >= event.sold_value");
  } else if (f.paymentStatus === "pending") {
    qb.andWhere("event.received_value < event.sold_value");
  } else if (f.paymentStatus === "overdue") {
    qb.andWhere("event.received_value < event.sold_value");
    qb.andWhere("event.date < CURRENT_DATE");
  }
  if (!opts.skipDelivered) {
    if (f.delivered === true) qb.andWhere("event.status = 'DONE'");
    else if (f.delivered === false)
      qb.andWhere("event.status IN ('CONFIRMED', 'IN_PROGRESS')");
  }
  if (f.search) {
    qb.andWhere("(event.title ILIKE :s OR customer.name ILIKE :s)", {
      s: `%${f.search}%`,
    });
  }
}
