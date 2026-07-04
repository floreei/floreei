import type {
  Cashflow,
  CashInInput,
  DreReport,
  FinanceSummary,
  MonthlyCashflow,
  Payment,
  PaymentInput,
  PaymentResult,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

export function useFinanceSummary() {
  return useQuery({
    queryKey: ["finance", "summary"],
    queryFn: () => api.get<FinanceSummary>("/finance/summary"),
  });
}

export function useDre(from?: string, to?: string) {
  return useQuery({
    queryKey: ["finance", "dre", from, to],
    queryFn: () => api.get<DreReport>("/finance/dre", { from, to }),
  });
}

export function useCashflow(from: string, to: string) {
  return useQuery({
    queryKey: ["finance", "cashflow", from, to],
    queryFn: () => api.get<Cashflow>("/finance/cashflow", { from, to }),
  });
}

export function useMonthlyCashflow(year: number) {
  return useQuery({
    queryKey: ["finance", "cashflow", "monthly", year],
    queryFn: () =>
      api.get<MonthlyCashflow>("/finance/cashflow/monthly", {
        year: String(year),
      }),
  });
}

export function useCashIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CashInInput) =>
      api.post<Payment>("/finance/cash-in", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["finance"] });
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["purchases"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useReceiveForEvent() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({ eventId, input }: { eventId: string; input: PaymentInput }) =>
      api.post<PaymentResult>(`/finance/events/${eventId}/payments`, input),
    onSuccess: invalidate,
  });
}

export function usePayForPurchase() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: ({
      purchaseId,
      input,
    }: {
      purchaseId: string;
      input: PaymentInput;
    }) => api.post<PaymentResult>(`/finance/purchases/${purchaseId}/payments`, input),
    onSuccess: invalidate,
  });
}

export function useEventPayments(eventId: string) {
  return useQuery({
    queryKey: ["finance", "event-payments", eventId],
    queryFn: () => api.get<Payment[]>(`/finance/events/${eventId}/payments`),
  });
}

export function useDeleteEventPayment(eventId: string) {
  const invalidate = useInvalidateFinance();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) =>
      api.delete<void>(`/finance/events/${eventId}/payments/${paymentId}`),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["finance", "event-payments", eventId] });
    },
  });
}

export function usePurchasePayments(purchaseId: string) {
  return useQuery({
    queryKey: ["finance", "purchase-payments", purchaseId],
    queryFn: () =>
      api.get<Payment[]>(`/finance/purchases/${purchaseId}/payments`),
  });
}

export function useDeletePurchasePayment(purchaseId: string) {
  const invalidate = useInvalidateFinance();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) =>
      api.delete<void>(`/finance/purchases/${purchaseId}/payments/${paymentId}`),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({
        queryKey: ["finance", "purchase-payments", purchaseId],
      });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useUpdateEventPayment(eventId: string) {
  const invalidate = useInvalidateFinance();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: PaymentInput }) =>
      api.patch<PaymentResult>(
        `/finance/events/${eventId}/payments/${paymentId}`,
        input,
      ),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["finance", "event-payments", eventId] });
    },
  });
}

export function useUpdatePurchasePayment(purchaseId: string) {
  const invalidate = useInvalidateFinance();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, input }: { paymentId: string; input: PaymentInput }) =>
      api.patch<PaymentResult>(
        `/finance/purchases/${purchaseId}/payments/${paymentId}`,
        input,
      ),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({
        queryKey: ["finance", "purchase-payments", purchaseId],
      });
      qc.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}
