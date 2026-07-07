"use client";

import type { Feature } from "@sistema-flores/types";
import { FEATURE_INFO } from "@sistema-flores/types";
import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useBillingPlans } from "@/lib/api/billing";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Tela exibida no lugar de um módulo fora do plano da empresa. Diz qual plano
 * vigente libera o recurso (definições vêm do console, não são fixas) e leva
 * o administrador à página de plano.
 */
export function FeatureUpsell({ feature }: { feature: Feature }) {
  const { user } = useAuth();
  const { data: plans } = useBillingPlans();
  const isAdmin = user?.role === "ADMIN";
  const info = FEATURE_INFO[feature];
  // Lista já vem ordenada do mais barato ao mais completo.
  const tier = plans?.plans.find((p) => p.features.includes(feature)) ?? null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-semibold">
            {info.label} não está no seu plano
          </h1>
          <p className="text-sm text-muted-foreground">{info.description}</p>
          {tier ? (
            <p className="text-sm text-muted-foreground">
              Disponível a partir do plano{" "}
              <span className="font-medium text-foreground">{tier.name}</span>.
            </p>
          ) : null}
        </div>
        {isAdmin ? (
          <Button asChild className="w-full">
            <Link href="/plano">Ver planos</Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Fale com o administrador da sua empresa para mudar o plano.
          </p>
        )}
      </div>
    </div>
  );
}
