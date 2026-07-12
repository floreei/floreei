import type {
  AttachmentInput,
  ConvertQuoteInput,
  EditSaleItemsInput,
  Event,
  EventAttachment,
  EventInput,
  EventQuery,
  EventUpdate,
  Paginated,
  QuickSaleInput,
  SalesChannel,
  SalesInsights,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const KEY = "events";

export function useEvents(query: Partial<EventQuery> = {}) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () =>
      api.get<Paginated<Event>>("/events", {
        page: query.page ?? 1,
        sort: query.sort,
        order: query.order,
        pageSize: query.pageSize ?? 20,
        search: query.search,
        type: query.type,
        channel: query.channel,
        status: query.status,
        customerId: query.customerId,
        paymentStatus: query.paymentStatus,
        delivered: query.delivered,
        from: query.from,
        to: query.to,
      }),
  });
}

/** Insights práticos da tela de Vendas (mais/parados, top/em risco) no período. */
export function useSalesInsights(
  from?: string,
  to?: string,
  channel?: SalesChannel,
) {
  return useQuery({
    queryKey: [KEY, "insights", from ?? "", to ?? "", channel ?? ""],
    queryFn: () =>
      api.get<SalesInsights>("/events/insights", {
        from: from || undefined,
        to: to || undefined,
        channel,
      }),
    staleTime: 60_000,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => api.get<Event>(`/events/${id}`),
    enabled: Boolean(id),
  });
}

export function useSaveEvent(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput | EventUpdate) =>
      id
        ? api.patch<Event>(`/events/${id}`, input)
        : api.post<Event>("/events", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useConvertQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      quoteId,
      input,
    }: {
      quoteId: string;
      input: ConvertQuoteInput;
    }) => api.post<Event>(`/events/from-quote/${quoteId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useQuickSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuickSaleInput) =>
      api.post<Event>("/events/quick", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useEditSaleItems(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EditSaleItemsInput) =>
      api.patch<Event>(`/events/${id}/items`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Event>(`/events/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useEventAttachments(eventId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "attachments", eventId],
    queryFn: () => api.get<EventAttachment[]>(`/events/${eventId}/attachments`),
    enabled: Boolean(eventId),
  });
}

export function useAddAttachment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttachmentInput) =>
      api.post<EventAttachment>(`/events/${eventId}/attachments`, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [KEY, "attachments", eventId] }),
  });
}

export function useDeleteAttachment(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete<void>(`/events/attachments/${attachmentId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [KEY, "attachments", eventId] }),
  });
}
