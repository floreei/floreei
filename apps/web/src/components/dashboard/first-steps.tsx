"use client";

import type { FirstSteps as FirstStepsData } from "@sistema-flores/types";
import { Check, ChevronRight, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FocusChooser } from "@/components/onboarding/focus-chooser";
import { Card } from "@/components/ui/card";
import { useFirstSteps } from "@/lib/api/dashboard";
import { useAuth } from "@/lib/auth/auth-context";
import { type BusinessFocus, useBusinessFocus } from "@/lib/onboarding/focus";
import { cn } from "@/lib/utils";

type StepKey = keyof FirstStepsData;

interface Step {
  key: StepKey;
  label: string;
  hint: string;
  href: string;
}

const BASE: Step[] = [
  {
    key: "hasCategory",
    label: "Crie uma categoria",
    hint: "Agrupa seus insumos (Flores, Laços…)",
    href: "/insumos",
  },
  {
    key: "hasProduct",
    label: "Cadastre um insumo",
    hint: "A flor/material que você compra e vende",
    href: "/insumos",
  },
];

const RETAIL: Step[] = [
  {
    key: "hasArrangement",
    label: "Monte um buquê",
    hint: "Ficha técnica: o preço sai do custo",
    href: "/buques",
  },
  {
    key: "hasRetailSale",
    label: "Faça uma venda direta",
    hint: "Venda o buquê ao cliente e receba",
    href: "/vendas",
  },
];

const WHOLESALE: Step[] = [
  {
    key: "hasSupplier",
    label: "Cadastre um fornecedor",
    hint: "De quem você compra insumos",
    href: "/fornecedores",
  },
  {
    key: "hasPurchase",
    label: "Registre uma compra",
    hint: "Entra no estoque e atualiza o custo",
    href: "/compras",
  },
  {
    key: "hasWholesaleSale",
    label: "Faça uma venda no atacado",
    hint: "Revenda o maço a outro lojista",
    href: "/atacado",
  },
];

function buildSteps(focus: BusinessFocus): Step[] {
  const middle =
    focus === "RETAIL"
      ? RETAIL
      : focus === "WHOLESALE"
        ? WHOLESALE
        : [...RETAIL, ...WHOLESALE];
  return [...BASE, ...middle];
}

function dismissedKey(companyId: string): string {
  return `floreei:steps-dismissed:${companyId}`;
}

/**
 * Checklist de primeiros passos no Início, na ordem de dependência do negócio
 * (categoria → insumo → [buquê/venda direta | fornecedor/compra/atacado]).
 * Personalizado pelo foco do lojista; some quando tudo é feito ou é dispensado.
 */
export function FirstSteps() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const { focus, choose, reset } = useBusinessFocus();
  const { data } = useFirstSteps(Boolean(companyId));
  const [dismissed, setDismissed] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!companyId) return;
    setDismissed(Boolean(localStorage.getItem(dismissedKey(companyId))));
  }, [companyId]);

  const dismiss = () => {
    if (companyId) localStorage.setItem(dismissedKey(companyId), "1");
    setDismissed(true);
  };

  // Aguarda hidratar (focus/dismissed indefinidos) para não piscar.
  if (!data || dismissed === undefined || dismissed || focus === undefined) {
    return null;
  }

  // Ainda não escolheu como vende: pergunta primeiro (personaliza os passos).
  if (focus === null) {
    return (
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Como você vende?
          </p>
          <DismissButton onClick={dismiss} />
        </div>
        <p className="text-sm text-muted-foreground">
          Escolha para receber um passo a passo sob medida.
        </p>
        <FocusChooser onChoose={choose} />
      </Card>
    );
  }

  const steps = buildSteps(focus);
  const done = steps.filter((s) => data[s.key]).length;
  if (done === steps.length) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Primeiros passos
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            trocar
          </button>
          <p className="text-sm text-muted-foreground tabular-nums">
            {done} de {steps.length} concluídos
          </p>
          <DismissButton onClick={dismiss} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => {
          const complete = data[step.key];
          return (
            <Link
              key={step.key}
              href={step.href}
              className={cn(
                "flex min-h-[52px] items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                complete
                  ? "border-transparent bg-muted/50 text-muted-foreground"
                  : "border-border hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  complete
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card",
                )}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    complete && "line-through decoration-muted-foreground/50",
                  )}
                >
                  {step.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {step.hint}
                </span>
              </span>
              {!complete ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dispensar primeiros passos"
      className="text-muted-foreground/60 transition-colors hover:text-foreground"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
