"use client";

import type { Product } from "@sistema-flores/types";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCategories, useProducts } from "@/lib/api/catalog";
import { unitLabels } from "@/lib/labels";
import { cn, formatCurrency } from "@/lib/utils";

/**
 * Seletor de produto/insumo buscável e **agrupado por categoria**. Usa o mesmo
 * `command.tsx` (cmdk) da busca global. Serve para flores, laços, doces,
 * decorativos — qualquer produto do catálogo entra num buquê.
 */
export function ProductCombobox({
  value,
  onChange,
  placeholder = "Insumo",
  className,
  "data-testid": testId,
}: {
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}) {
  const { data: products } = useProducts({ pageSize: 200, onlyActive: true });
  const { data: categories } = useCategories();
  const [open, setOpen] = useState(false);

  const catName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories ?? []) m.set(c.id, c.name);
    return m;
  }, [categories]);

  const groups = useMemo(() => {
    const byCat = new Map<string, { name: string; items: Product[] }>();
    for (const p of products?.data ?? []) {
      const name = catName.get(p.categoryId) ?? "Outros";
      const g = byCat.get(p.categoryId) ?? { name, items: [] };
      g.items.push(p);
      byCat.set(p.categoryId, g);
    }
    return Array.from(byCat.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [products, catName]);

  const selected = products?.data.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={testId}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[260px]">
        <Command>
          <CommandInput placeholder="Buscar insumo…" />
          <CommandList>
            <CommandEmpty>Nenhum insumo encontrado.</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g.name} heading={g.name}>
                {g.items.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${g.name}`}
                    onSelect={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === p.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded object-cover"
                      />
                    ) : null}
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(p.currentUnitCost)}/{unitLabels[p.unit]}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
