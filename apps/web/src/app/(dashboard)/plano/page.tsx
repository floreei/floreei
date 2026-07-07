"use client";

import type { PlanOffer, PlanTier } from "@sistema-flores/types";
import { ALL_FEATURES } from "@sistema-flores/types";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBillingPlans,
  useBillingSubscription,
  useCancelSubscription,
  useChangePlan,
  useSubscribe,
} from "@/lib/api/billing";
import { useAuth } from "@/lib/auth/auth-context";
import { FEATURE_INFO } from "@/lib/billing/features";
import { cn, formatCurrency } from "@/lib/utils";

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  AUTHORIZED: "Ativa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
};

export default function PlanoPage() {
  const { user } = useAuth();
  const { data: plans, isLoading: loadingPlans } = useBillingPlans();
  const { data: billing, isLoading: loadingBilling } = useBillingSubscription();
  const subscribe = useSubscribe();
  const changePlan = useChangePlan();
  const cancelSubscription = useCancelSubscription();
  const [confirmTier, setConfirmTier] = useState<PlanTier | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const subscription = billing?.subscription ?? null;
  const subscribed = subscription?.status === "AUTHORIZED";
  const activeUsers = plans?.activeUsers ?? billing?.activeUsers ?? 1;
  const usersLabel = `${activeUsers} ${activeUsers === 1 ? "usuário" : "usuários"}`;

  const monthlyTotal = (offer: PlanOffer) =>
    offer.basePrice + activeUsers * offer.userPrice;

  async function onSubscribe(tier: PlanTier) {
    try {
      const result = await subscribe.mutateAsync(tier);
      window.location.href = result.initPoint;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a assinatura. Tente novamente.",
      );
    }
  }

  async function onChangePlan(tier: PlanTier) {
    try {
      await changePlan.mutateAsync(tier);
      setConfirmTier(null);
      toast.success("Plano alterado.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível trocar de plano. Tente novamente.",
      );
    }
  }

  async function onCancel() {
    try {
      await cancelSubscription.mutateAsync();
      setConfirmCancel(false);
      toast.success("Assinatura cancelada.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar. Tente novamente.",
      );
    }
  }

  if (loadingPlans || loadingBilling) {
    return (
      <div className="space-y-6">
        <PageHeader title="Plano" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plano"
        description="Faça o upgrade quando a sua empresa precisar de mais. Cada usuário ativo custa R$ 16,00 por mês, em qualquer plano."
      />

      {subscription ? (
        <Card className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sua assinatura</p>
              <p className="text-lg font-semibold">
                Plano {plans?.plans.find((p) => p.id === subscription.tier)?.name ?? subscription.tier}{" "}
                <Badge
                  variant={subscribed ? "default" : "secondary"}
                  className="ml-1 align-middle"
                >
                  {SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status}
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatCurrency(subscription.amount)}/mês ·{" "}
                {subscription.billedUsers}{" "}
                {subscription.billedUsers === 1 ? "usuário" : "usuários"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {subscription.status === "PENDING" && subscription.initPoint ? (
                <Button asChild>
                  <a href={subscription.initPoint}>Continuar pagamento</a>
                </Button>
              ) : null}
              {subscription.status !== "CANCELLED" ? (
                <Button
                  variant="outline"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancelar assinatura
                </Button>
              ) : null}
            </div>
          </div>
          {subscription.status === "PENDING" ? (
            <p className="text-sm text-muted-foreground">
              O pagamento ainda não foi concluído no Mercado Pago. Continue de
              onde parou ou escolha outro plano abaixo.
            </p>
          ) : null}
          {subscription.graceDaysLeft !== null ? (
            <p className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Pagamento pendente. Regularize em até {subscription.graceDaysLeft}{" "}
              {subscription.graceDaysLeft === 1 ? "dia" : "dias"} para não perder o acesso.
            </p>
          ) : null}
        </Card>
      ) : user?.access?.status === "TRIAL" ? (
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            Você está no período gratuito
            {typeof user.access.trialDaysLeft === "number"
              ? ` — ${user.access.trialDaysLeft} ${user.access.trialDaysLeft === 1 ? "dia restante" : "dias restantes"}`
              : ""}
            . Faça o upgrade para continuar depois que ele terminar.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans?.plans.map((offer) => {
          const isCurrent = subscription?.tier === offer.id && subscribed;
          const busy = subscribe.isPending || changePlan.isPending;
          return (
            <Card
              key={offer.id}
              className={cn(
                "flex flex-col gap-4 p-5",
                isCurrent && "border-primary/40 ring-1 ring-primary/30",
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{offer.name}</h2>
                  {isCurrent ? <Badge>Seu plano</Badge> : null}
                </div>
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
                  Com {usersLabel}: {formatCurrency(monthlyTotal(offer))}/mês
                </p>
              </div>

              <ul className="flex-1 space-y-2 text-sm">
                {ALL_FEATURES.filter((f) => offer.features.includes(f)).map(
                  (f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {FEATURE_INFO[f].label}
                    </li>
                  ),
                )}
              </ul>

              {isCurrent ? (
                <Button variant="outline" disabled>
                  Plano atual
                </Button>
              ) : !isAdmin ? null : subscribed ? (
                <Button
                  onClick={() => setConfirmTier(offer.id)}
                  disabled={busy}
                >
                  Mudar para este plano
                </Button>
              ) : (
                <Button onClick={() => onSubscribe(offer.id)} disabled={busy}>
                  {subscribe.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Fazer upgrade
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        {isAdmin
          ? "O upgrade vira uma assinatura mensal no Mercado Pago. Mudou a equipe? O valor é recalculado e vale a partir da próxima cobrança."
          : "Só o administrador da empresa pode fazer o upgrade ou mudar o plano."}
      </p>

      <Dialog
        open={confirmTier !== null}
        onOpenChange={(open) => !open && setConfirmTier(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mudar de plano</DialogTitle>
            <DialogDescription>
              Os recursos mudam agora e o novo valor passa a valer na próxima
              cobrança da assinatura.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTier(null)}>
              Voltar
            </Button>
            <Button
              onClick={() => confirmTier && onChangePlan(confirmTier)}
              disabled={changePlan.isPending}
            >
              {changePlan.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Confirmar mudança
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar assinatura</DialogTitle>
            <DialogDescription>
              Sua empresa perde o acesso ao sistema alguns dias após o
              cancelamento. Você pode assinar de novo quando quiser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              Manter assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Cancelar assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
