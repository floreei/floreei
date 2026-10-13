import type {
  PendingDeliverySale,
  ProductUnit,
} from "@sistema-flores/types";
import { unitLabels } from "./labels";
import { formatDateWithWeekday } from "./utils";
import { fmtQty } from "./whatsapp";

/** Quantidade de um produto para um dia (sem preço — é o que vai para a rua). */
export interface DaySummaryLine {
  /** Data efetiva do pedido (entrega, senão venda), "AAAA-MM-DD". */
  date: string;
  /** id do produto ou do buquê — produtos homônimos não se misturam. */
  id: string;
  kind: "product" | "arrangement";
  name: string;
  unit: ProductUnit;
  quantity: number;
}

/** Soma de quantidades (decimais até 3 casas) sem resíduo de ponto flutuante. */
export const addQuantity = (a: number, b: number) => Math.round((a + b) * 1000) / 1000;

/** Data usada para agrupar/ordenar o pedido: entrega combinada, senão a venda. */
export const saleDay = (sale: Pick<PendingDeliverySale, "date" | "deliveryDate">) =>
  sale.deliveryDate ?? sale.date;

/**
 * Soma as quantidades por (dia, produto, unidade) dos pedidos informados.
 * Ordena por dia crescente e, dentro do dia, maior quantidade primeiro.
 */
export function buildDaySummary(sales: PendingDeliverySale[]): DaySummaryLine[] {
  const byKey = new Map<string, DaySummaryLine>();
  for (const sale of sales) {
    const date = saleDay(sale);
    for (const item of sale.items) {
      const key = `${date}|${item.kind}:${item.id}:${item.unit}`;
      const prev = byKey.get(key);
      if (prev) prev.quantity = addQuantity(prev.quantity, item.quantity);
      else
        byKey.set(key, {
          date,
          id: item.id,
          kind: item.kind,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
        });
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || b.quantity - a.quantity,
  );
}

/** "335 maços de Gipso" / "1 maço de Gipso". */
export function summaryLineText(line: DaySummaryLine): string {
  const unit = (unitLabels[line.unit] ?? line.unit).toLowerCase();
  const plural = line.quantity === 1 ? "" : "s";
  return `${fmtQty(line.quantity)} ${unit}${plural} de ${line.name}`;
}

/** "Quarta-feira, 14/10" — cabeçalho de dia no texto exportado. */
export function summaryDayHeading(date: string): string {
  const full = formatDateWithWeekday(date); // "quarta-feira, 14/10/2026"
  const withoutYear = full.replace(/\/\d{4}$/, "");
  return withoutYear.charAt(0).toUpperCase() + withoutYear.slice(1);
}

/** Texto puro para copiar/imprimir: título, e um bloco por dia. Sem preço. */
export function daySummaryText(opts: {
  title: string;
  period: string;
  lines: DaySummaryLine[];
}): string {
  const out: string[] = [`${opts.title} (${opts.period})`];
  let currentDay: string | null = null;
  for (const line of opts.lines) {
    if (line.date !== currentDay) {
      currentDay = line.date;
      out.push("", summaryDayHeading(line.date));
    }
    out.push(summaryLineText(line));
  }
  return out.join("\n");
}
