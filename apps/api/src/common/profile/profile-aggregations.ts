import type {
  ProfileMonthlyPoint,
  ProfileOrderItem,
  ProfileTopItem,
} from "@sistema-flores/types";
import { roundMoney } from "../money/money";

function roundQty(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Agrega itens de linha por descrição (case-insensitive) e ranqueia pelos mais
 * frequentes — "itens mais vendidos/comprados". Desempate pelo maior valor.
 */
export function aggregateTopItems(
  items: ProfileOrderItem[],
  limit = 8,
): ProfileTopItem[] {
  const map = new Map<string, ProfileTopItem>();
  for (const it of items) {
    const name = it.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const cur = map.get(key) ?? { name, quantity: 0, total: 0 };
    cur.quantity += it.quantity;
    cur.total += it.lineTotal;
    map.set(key, cur);
  }
  return [...map.values()]
    .map((i) => ({
      name: i.name,
      quantity: roundQty(i.quantity),
      total: roundMoney(i.total),
    }))
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
    .slice(0, limit);
}

/** Chaves "AAAA-MM" dos últimos N meses, terminando no mês corrente. */
function lastMonthKeys(n: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

/**
 * Série mensal (faturamento/gasto) dos últimos N meses, com meses vazios
 * preenchidos em zero. `date` é uma data ISO "AAAA-MM-DD".
 */
export function monthlySeries(
  orders: { date: string; value: number }[],
  months = 12,
): ProfileMonthlyPoint[] {
  const agg = new Map<string, { total: number; count: number }>();
  for (const o of orders) {
    const month = (o.date ?? "").slice(0, 7);
    if (month.length !== 7) continue;
    const cur = agg.get(month) ?? { total: 0, count: 0 };
    cur.total += o.value;
    cur.count += 1;
    agg.set(month, cur);
  }
  return lastMonthKeys(months).map((month) => {
    const a = agg.get(month);
    return { month, total: roundMoney(a?.total ?? 0), count: a?.count ?? 0 };
  });
}

/** Mês de maior faturamento entre os que tiveram pedidos; null se nenhum. */
export function bestMonth(
  series: ProfileMonthlyPoint[],
): ProfileMonthlyPoint | null {
  let best: ProfileMonthlyPoint | null = null;
  for (const p of series) {
    if (p.count > 0 && (best === null || p.total > best.total)) best = p;
  }
  return best;
}
