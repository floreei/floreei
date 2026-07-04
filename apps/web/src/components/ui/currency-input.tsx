"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const brl = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  > {
  /** Valor em reais (ex.: 1234.56). */
  value: number;
  /** Chamado com o novo valor numérico em reais. */
  onChange: (value: number) => void;
}

/**
 * Campo de moeda com máscara "R$ 1.234,56". Funciona como acumulador de
 * centavos: os dígitos digitados formam o valor da direita para a esquerda,
 * então nunca há posição de cursor "quebrada".
 */
export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(({ value, onChange, className, ...props }, ref) => {
  const display = value > 0 ? brl.format(value) : "";
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        ref={ref}
        inputMode="numeric"
        placeholder="0,00"
        className={cn("pl-9 tabular-nums", className)}
        value={display}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits) / 100 : 0);
        }}
        {...props}
      />
    </div>
  );
});
CurrencyInput.displayName = "CurrencyInput";
