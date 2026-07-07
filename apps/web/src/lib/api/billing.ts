import type {
  BillingPlans,
  BillingSummary,
  PlanTier,
  SubscribeResult,
  SubscriptionView,
  TrialSummary,
} from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export function useBillingPlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => api.get<BillingPlans>("/billing/plans"),
    staleTime: 60_000,
  });
}

export function useBillingSubscription() {
  return useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: () => api.get<BillingSummary>("/billing/subscription"),
    staleTime: 30_000,
  });
}

/** Uso da empresa no trial + plano recomendado (tela de fim de trial). */
export function useTrialSummary(enabled = true) {
  return useQuery({
    queryKey: ["billing", "trial-summary"],
    queryFn: () => api.get<TrialSummary>("/billing/trial-summary"),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Cria a assinatura e devolve o link do checkout do Mercado Pago. */
export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: PlanTier) =>
      api.post<SubscribeResult>("/billing/subscribe", { tier }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing"] }),
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tier: PlanTier) =>
      api.post<SubscriptionView>("/billing/change-plan", { tier }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing"] });
      qc.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ cancelled: boolean }>("/billing/cancel"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing"] }),
  });
}
