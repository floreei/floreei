"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Quantidade digitável de um item do carrinho, para usar entre os botões de
 * menos/mais. Só repassa valores válidos (> 0): campo vazio ou zerado durante
 * a digitação não mexe no item, e ao sair do campo volta a mostrar a
 * quantidade vigente. Remover o item continua sendo pela lixeira.
 */
export function QuantityInput({
  value,
  onChange,
  fractional = false,
  label,
  className,
}: {
  value: number;
  onChange: (quantity: number) => void;
  /** Unidade aceita decimal (ex.: metro, grama); senão só inteiros. */
  fractional?: boolean;
  label: string;
  className?: string;
}) {
  // Texto em edição; null = fora de edição, mostra a quantidade vigente.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      type="text"
      inputMode={fractional ? "decimal" : "numeric"}
      aria-label={label}
      className={cn(
        "h-9 w-14 rounded-md border border-input bg-background px-1 text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      value={draft ?? String(value).replace(".", ",")}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const text = e.target.value.replace(fractional ? /[^\d.,]/g : /\D/g, "");
        setDraft(text);
        const quantity = Number(text.replace(",", "."));
        if (Number.isFinite(quantity) && quantity > 0) onChange(quantity);
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}
