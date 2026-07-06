"use client";

import { Input } from "@/components/ui/input";
import {
  PERIOD_PRESETS,
  type PeriodPreset,
} from "@/lib/finance-period";
import { cn } from "@/lib/utils";

/**
 * Filtro de período do Financeiro: presets rápidos + intervalo de datas
 * personalizado (editar uma data muda para "personalizado").
 */
export function PeriodFilter({
  preset,
  from,
  to,
  onPreset,
  onCustom,
}: {
  preset: PeriodPreset;
  from: string;
  to: string;
  onPreset: (p: PeriodPreset) => void;
  onCustom: (from: string, to: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPreset(p.value)}
            className={cn(
              "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
              preset === p.value
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
          preset === "custom" ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <span className="text-xs font-medium text-muted-foreground">De</span>
        <Input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onCustom(e.target.value, to)}
          className="h-8 w-[8.5rem] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          aria-label="Data inicial"
        />
        <span className="text-xs font-medium text-muted-foreground">até</span>
        <Input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onCustom(from, e.target.value)}
          className="h-8 w-[8.5rem] border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          aria-label="Data final"
        />
      </div>
    </div>
  );
}
