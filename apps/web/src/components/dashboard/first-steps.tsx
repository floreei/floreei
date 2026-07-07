"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useFirstSteps } from "@/lib/api/dashboard";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

interface Step {
  key: "hasProduct" | "hasCustomer" | "hasSale" | "storeEnabled" | "hasTeammate";
  label: string;
  hint: string;
  href: string;
  adminOnly?: boolean;
}

const STEPS: Step[] = [
  {
    key: "hasProduct",
    label: "Cadastre um insumo (flor, papel, cola…)",
    hint: "É a base das vendas e dos buquês",
    href: "/insumos",
  },
  {
    key: "hasCustomer",
    label: "Cadastre um cliente",
    hint: "Para acompanhar pedidos e datas",
    href: "/clientes",
  },
  {
    key: "hasSale",
    label: "Registre sua primeira venda",
    hint: "Balcão, entrega ou evento",
    href: "/eventos",
  },
  {
    key: "storeEnabled",
    label: "Ative sua loja online",
    hint: "Venda pela internet com Mercado Pago",
    href: "/loja",
    adminOnly: true,
  },
  // Convidar equipe é pago (entra na mensalidade) — fora do onboarding grátis.
];

/**
 * Checklist de primeiros passos, exibido no Início durante o período gratuito.
 * Trial que ATIVA converte: cada passo leva direto para a tela certa. Some
 * quando tudo foi feito ou quando a empresa deixa o trial.
 */
export function FirstSteps() {
  const { user } = useAuth();
  const inTrial = user?.access?.status === "TRIAL";
  const { data } = useFirstSteps(Boolean(inTrial));

  if (!inTrial || !data) return null;

  const steps = STEPS.filter((s) => !s.adminOnly || user?.role === "ADMIN");
  const done = steps.filter((s) => data[s.key]).length;
  if (done === steps.length) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Primeiros passos
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {done} de {steps.length} concluídos
        </p>
      </div>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
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
