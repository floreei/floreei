"use client";

import type { SortOrder } from "@sistema-flores/types";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useCallback, useState } from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface SortState {
  sort?: string;
  order?: SortOrder;
  onSort: (column: string) => void;
}

/**
 * Estado de ordenação para tabelas. `onChange` (ex.: resetar a página) roda a
 * cada clique. 1º clique numa coluna = asc; cliques seguintes alternam asc/desc.
 */
export function useTableSort(onChange?: () => void): SortState {
  const [sort, setSort] = useState<string>();
  const [order, setOrder] = useState<SortOrder>();

  const onSort = useCallback(
    (column: string) => {
      setSort((prev) => {
        if (prev === column) {
          setOrder((o) => (o === "asc" ? "desc" : "asc"));
          return prev;
        }
        setOrder("asc");
        return column;
      });
      onChange?.();
    },
    [onChange],
  );

  return { sort, order, onSort };
}

/** Cabeçalho de tabela clicável que ordena por `column`. */
export function SortableHead({
  column,
  state,
  children,
  className,
  align = "left",
}: {
  column: string;
  state: SortState;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const active = state.sort === column;
  const Icon = active ? (state.order === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => state.onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "",
        )}
      >
        {children}
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            active ? "text-primary" : "text-muted-foreground/50",
          )}
        />
      </button>
    </TableHead>
  );
}
