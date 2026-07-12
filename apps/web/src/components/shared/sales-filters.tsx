"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function presets() {
  const now = new Date();
  const today = toIso(now);
  const weekAgo = toIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const monthStart = toIso(new Date(now.getFullYear(), now.getMonth(), 1));
  return [
    { label: "Todo período", from: "", to: "" },
    { label: "Hoje", from: today, to: today },
    { label: "7 dias", from: weekAgo, to: today },
    { label: "Este mês", from: monthStart, to: today },
  ];
}

/**
 * Busca por nome + (opcional) filtro de período — reutilizado nas listas
 * (vendas, compras, pedidos da loja etc.). Páginas sem data útil (fornecedores,
 * buquês, produtos) passam só `search`/`onSearchChange` e o filtro de data some.
 */
export function SalesFilters({
  search,
  onSearchChange,
  from = "",
  to = "",
  onDateChange,
  searchPlaceholder = "Buscar por cliente ou título…",
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  from?: string;
  to?: string;
  onDateChange?: (from: string, to: string) => void;
  searchPlaceholder?: string;
  /** Controles extras à direita (ex.: chips de categoria/status). */
  children?: React.ReactNode;
}) {
  const options = presets();
  const activePreset = options.find((p) => p.from === from && p.to === to);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {children}

      {onDateChange ? (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:pb-0">
          {options.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onDateChange(p.from, p.to)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                activePreset?.label === p.label
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5",
            !activePreset ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">De</span>
          <Input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onDateChange(e.target.value, to)}
            className="h-8 w-[8.5rem] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            aria-label="Data inicial"
          />
          <span className="text-xs font-medium text-muted-foreground">até</span>
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => onDateChange(from, e.target.value)}
            className="h-8 w-[8.5rem] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            aria-label="Data final"
          />
        </div>
      </div>
      ) : null}
    </div>
  );
}
