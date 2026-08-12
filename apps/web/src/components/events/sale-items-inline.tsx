import type { EventItem } from "@sistema-flores/types";
import { unitLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";

/** Itens de uma venda em lista compacta, para expandir direto na listagem. */
export function SaleItemsInline({ items }: { items: EventItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-1 text-sm text-muted-foreground">
        Venda de valor livre — sem itens detalhados.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 py-1.5 text-sm"
        >
          <span className="min-w-0 truncate">{item.description}</span>
          <span className="flex shrink-0 items-center gap-4">
            <span className="tabular-nums text-muted-foreground">
              {item.quantity} {unitLabels[item.unit] ?? item.unit}
            </span>
            <span className="w-24 text-right tabular-nums">
              {formatCurrency(item.lineTotal)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
