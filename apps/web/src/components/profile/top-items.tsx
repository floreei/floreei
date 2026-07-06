import type { ProfileTopItem } from "@sistema-flores/types";
import { formatCurrency } from "@/lib/utils";

const fmtQty = (q: number): string =>
  Number.isInteger(q)
    ? String(q)
    : q.toFixed(3).replace(/\.?0+$/, "").replace(".", ",");

/**
 * Ranking dos itens mais vendidos/comprados, com barra proporcional à
 * quantidade acumulada.
 */
export function TopItems({ items }: { items: ProfileTopItem[] }) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted-foreground">
        Sem itens registrados ainda.
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.quantity));

  return (
    <ul className="divide-y divide-border/60">
      {items.map((it, idx) => (
        <li key={it.name} className="px-5 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium">
              <span className="text-muted-foreground">{idx + 1}.</span> {it.name}
            </span>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {fmtQty(it.quantity)} ·{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(it.total)}
              </span>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${Math.max(6, (it.quantity / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
