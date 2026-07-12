import type {
  Paginated,
  Quote,
  QuoteInput,
  QuoteQuery,
  QuoteStatus,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const KEY = "quotes";

export function useQuotes(query: Partial<QuoteQuery> = {}) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () =>
      api.get<Paginated<Quote>>("/quotes", {
        page: query.page ?? 1,
        sort: query.sort,
        order: query.order,
        pageSize: query.pageSize ?? 20,
        search: query.search,
        status: query.status,
        customerId: query.customerId,
      }),
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => api.get<Quote>(`/quotes/${id}`),
    enabled: Boolean(id),
  });
}

export function useSaveQuote(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuoteInput) =>
      id
        ? api.patch<Quote>(`/quotes/${id}`, input)
        : api.post<Quote>("/quotes", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDuplicateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Quote>(`/quotes/${id}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useChangeQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus }) =>
      api.patch<Quote>(`/quotes/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/quotes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
