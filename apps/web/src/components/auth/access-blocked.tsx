"use client";

import type { PlanTier } from "@sistema-flores/types";
import { planPrice } from "@sistema-flores/types";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Flower2,
  Loader2,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useBillingPlans,
  useBillingSubscription,
  useSubscribe,
  useTrialSummary,
} from "@/lib/api/billing";
import type { BlockedAccess } from "@/lib/auth/auth-context";
import { useAuth } from "@/lib/auth/auth-context";
import { FEATURE_INFO } from "@/lib/billing/features";
import { PLANS_ENABLED } from "@/lib/billing/plans-config";
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
            {!PLANS_ENABLED
              ? "Os planos ainda estão em fase de planejamento. Fale com a gente pelo WhatsApp para liberar o seu acesso — a gente resolve rapidinho."
              : overdue
                ? "Não conseguimos cobrar a sua assinatura. Reative seu plano para voltar a usar o Floreei — leva um minuto."
                : "Para continuar usando o Floreei, escolha um plano e faça o upgrade. O primeiro usuário já está incluso; cada usuário adicional custa R$ 16,00 por mês."}
          </p>
        </div>

        {PLANS_ENABLED ? (
          <>
            <PendingCheckoutNotice />
            {!overdue ? <TrialRecap /> : null}
            <PlanPicker cta={overdue ? "Reativar plano" : "Fazer upgrade"} />
          </>
        ) : (
          <div className="flex justify-center">
            <Button asChild size="lg">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                Falar com a gente
              </a>
            </Button>
          </div>
        )}

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

/**
 * Checkout iniciado e não concluído: oferece retomar o pagamento no MP em vez
 * de começar do zero — recupera o quase-cliente.
 */
function PendingCheckoutNotice() {
  const { data } = useBillingSubscription();
  const sub = data?.subscription;
  if (!sub || sub.status !== "PENDING" || !sub.initPoint) return null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left">
      <p className="text-sm">
        <span className="font-medium">Você começou a assinar</span> e o
        pagamento não foi concluído. Dá para continuar de onde parou.
      </p>
      <Button asChild size="sm">
        <a href={sub.initPoint}>
          Continuar pagamento
          <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

/** O que a empresa fez no trial — vender com os números dela mesma. */
function TrialRecap() {
  const { data } = useTrialSummary();
  if (!data) return null;

  const parts: string[] = [];
  if (data.sales > 0) {
    parts.push(
      `${data.sales} ${data.sales === 1 ? "venda" : "vendas"} (${formatCurrency(data.revenue)})`,
    );
  }
  if (data.quotes > 0) {
    parts.push(`${data.quotes} ${data.quotes === 1 ? "orçamento" : "orçamentos"}`);
  }
  if (data.products > 0) {
    parts.push(`${data.products} ${data.products === 1 ? "produto" : "produtos"}`);
  }
  if (data.customers > 0) {
    parts.push(`${data.customers} ${data.customers === 1 ? "cliente" : "clientes"}`);
  }
  if (parts.length === 0) return null;

  return (
    <p className="mx-auto max-w-xl text-center text-sm">
      No seu período gratuito você registrou{" "}
      <span className="font-medium">{parts.join(", ")}</span>. Continue de onde
      parou — está tudo guardado.
    </p>
  );
}

/** Grade dos 3 planos com o upgrade (redireciona ao checkout do MP). */
function PlanPicker({ cta }: { cta: string }) {
  const { data, isLoading } = useBillingPlans();
  const { data: summary } = useTrialSummary();
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
        // Destaca o plano recomendado pelo uso no trial; sem resumo, o do meio.
        const recommended = summary?.recommendedTier === offer.id;
        const highlighted = summary ? recommended : index === 1;
        const total = planPrice(offer, activeUsers);
        return (
          <div
            key={offer.id}
            className={cn(
              "relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-card",
              highlighted && "border-primary/40 ring-1 ring-primary/30",
            )}
          >
            {recommended ? (
              <span className="absolute -top-3 left-5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                Recomendado para você
              </span>
            ) : null}
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
                1 usuário incluso · + {formatCurrency(offer.userPrice)} por
                usuário adicional
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
              {cta}
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
