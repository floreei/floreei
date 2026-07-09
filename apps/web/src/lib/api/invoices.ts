import type { Invoice, InvoiceCancelInput } from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const KEY = "invoices";

export function useInvoice(eventId: string | undefined) {
  return useQuery({
    queryKey: [KEY, eventId],
    queryFn: () => api.get<Invoice | null>(`/events/${eventId}/invoice`),
    enabled: Boolean(eventId),
  });
}

export function useInvoiceHistory(eventId: string | undefined) {
  return useQuery({
    queryKey: [KEY, eventId, "history"],
    queryFn: () => api.get<Invoice[]>(`/events/${eventId}/invoices`),
    enabled: Boolean(eventId),
  });
}

export function useEmitInvoice(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Invoice>(`/events/${eventId}/invoice`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, eventId] }),
  });
}

export function useCancelInvoice(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InvoiceCancelInput) =>
      api.post<Invoice>(`/events/${eventId}/invoice/cancel`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, eventId] }),
  });
}
