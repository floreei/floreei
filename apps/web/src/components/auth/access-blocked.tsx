"use client";

import type { PlanTier } from "@sistema-flores/types";
import { AlertTriangle, Check, Clock, Flower2, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBillingPlans, useSubscribe } from "@/lib/api/billing";
import type { BlockedAccess } from "@/lib/auth/auth-context";
import { useAuth } from "@/lib/auth/auth-context";
import { FEATURE_INFO } from "@/lib/billing/features";
import { cn, formatCurrency } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/?text=Preciso%20de%20ajuda%20com%20o%20Floreei";

/**
 * Tela exibida quando a empresa está autenticada mas sem acesso liberado.
 * Suspensa → falar com o suporte. Trial expirado ou pagamento vencido →
 * escolher um plano e assinar direto (checkout do Mercado Pago).
 */
export function AccessBlocked({ blocked }: { blocked: BlockedAccess }) {
  const { logout } = useAuth();
  const suspended = blocked.code === "COMPANY_SUSPENDED";
  const overdue = blocked.code === "PAYMENT_OVERDUE";

  if (suspended) {
    return (
      <Shell>
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <IconBubble icon={Lock} />
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold">Acesso suspenso</h1>
            <p className="text-sm text-muted-foreground">
              O acesso da sua empresa está temporariamente suspenso. Fale com a
              gente para reativar.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                Falar com a gente
              </a>
            </Button>
            <LogoutButton onLogout={logout} />
          </div>
          <Watermark />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-3 text-center">
          <IconBubble icon={overdue ? AlertTriangle : Clock} />
          <h1 className="font-serif text-2xl font-semibold sm:text-3xl">
            {overdue
              ? "Pagamento da assinatura pendente"
              : "Seu período gratuito terminou"}
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            {overdue
              ? "Não conseguimos cobrar a sua assinatura. Assine novamente para voltar a usar o Floreei — leva um minuto."
              : "Para continuar usando o Floreei, escolha um plano. Cada usuário ativo custa R$ 16,00 por mês, em qualquer plano."}
          </p>
        </div>

        <PlanPicker />

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Dúvidas?{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Fale com a gente
            </a>
          </p>
          <LogoutButton onLogout={logout} />
          <Watermark />
        </div>
      </div>
    </Shell>
  );
}

/** Grade dos 3 planos com botão de assinar (redireciona ao Mercado Pago). */
function PlanPicker() {
  const { data, isLoading } = useBillingPlans();
  const subscribe = useSubscribe();
  const [pendingTier, setPendingTier] = useState<PlanTier | null>(null);

  async function onSubscribe(tier: PlanTier) {
    setPendingTier(tier);
    try {
      const result = await subscribe.mutateAsync(tier);
      window.location.href = result.initPoint;
    } catch (error) {
      setPendingTier(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a assinatura. Tente novamente.",
      );
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeUsers = Math.max(1, data.activeUsers);
  const usersLabel = `${activeUsers} ${activeUsers === 1 ? "usuário" : "usuários"}`;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {data.plans.map((offer, index) => {
        const highlighted = index === 1; // plano do meio em evidência
        const total = offer.basePrice + activeUsers * offer.userPrice;
        return (
          <div
            key={offer.id}
            className={cn(
              "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-card",
              highlighted && "border-primary/40 ring-1 ring-primary/30",
            )}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{offer.name}</h2>
              <p className="text-sm text-muted-foreground">{offer.tagline}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-semibold tabular-nums">
                {formatCurrency(offer.basePrice)}
                <span className="text-sm font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                + {formatCurrency(offer.userPrice)} por usuário
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                Com {usersLabel}: {formatCurrency(total)}/mês
              </p>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {offer.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {FEATURE_INFO[f].label}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={highlighted ? "default" : "outline"}
              disabled={subscribe.isPending}
              onClick={() => onSubscribe(offer.id)}
            >
              {pendingTier === offer.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Assinar
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      {children}
    </div>
  );
}

function IconBubble({ icon: Icon }: { icon: typeof Lock }) {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Icon className="h-7 w-7" />
    </div>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => Promise<void> }) {
  return (
    <Button variant="ghost" className="w-full sm:w-auto" onClick={() => onLogout()}>
      Sair
    </Button>
  );
}

function Watermark() {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <Flower2 className="h-3.5 w-3.5" />
      Floreei
    </p>
  );
}
