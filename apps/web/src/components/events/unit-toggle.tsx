"use client";

import type { ProductUnit } from "@sistema-flores/types";
import { unitLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Alterna a unidade de venda de um produto de pacote (ex.: Maço | Haste). */
export function UnitToggle({
  purchaseUnit,
  unit,
  value,
  onChange,
}: {
  purchaseUnit: ProductUnit;
  unit: ProductUnit;
  value?: ProductUnit;
  onChange: (u: ProductUnit) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {[purchaseUnit, unit].map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            value === u
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {unitLabels[u]}
        </button>
      ))}
    </div>
  );
}
