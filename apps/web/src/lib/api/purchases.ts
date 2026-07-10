import type {
  AttachmentInput,
  Paginated,
  Purchase,
  PurchaseAttachment,
  PurchaseInput,
  PurchaseQuery,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const KEY = "purchases";

function useInvalidatePurchase() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: [KEY] });
    qc.invalidateQueries({ queryKey: ["stock"] });
    qc.invalidateQueries({ queryKey: ["finance"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    if (id) qc.invalidateQueries({ queryKey: [KEY, "detail", id] });
  };
}

export function usePurchases(query: Partial<PurchaseQuery> = {}) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () =>
      api.get<Paginated<Purchase>>("/purchases", {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        supplierId: query.supplierId,
        status: query.status,
        unpaidOnly: query.unpaidOnly,
        search: query.search,
        from: query.from,
        to: query.to,
      }),
  });
}

export function usePurchase(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => api.get<Purchase>(`/purchases/${id}`),
    enabled: Boolean(id),
  });
}

export function useSavePurchase(id?: string) {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (input: PurchaseInput) =>
      id
        ? api.patch<Purchase>(`/purchases/${id}`, input)
        : api.post<Purchase>("/purchases", input),
    onSuccess: () => invalidate(id),
  });
}

export function useDeletePurchase() {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/purchases/${id}`),
    onSuccess: () => invalidate(),
  });
}

export function useReceivePurchase() {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (id: string) => api.post<Purchase>(`/purchases/${id}/receive`, {}),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useUnreceivePurchase() {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<Purchase>(`/purchases/${id}/unreceive`, {}),
    onSuccess: (_data, id) => invalidate(id),
  });
}

// --- Anexos (comprovante de pagamento) ---------------------------------------

export function usePurchaseAttachments(purchaseId: string) {
  return useQuery({
    queryKey: [KEY, "attachments", purchaseId],
    queryFn: () =>
      api.get<PurchaseAttachment[]>(`/purchases/${purchaseId}/attachments`),
  });
}

export function useAddPurchaseAttachment(purchaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttachmentInput) =>
      api.post<PurchaseAttachment>(`/purchases/${purchaseId}/attachments`, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [KEY, "attachments", purchaseId] }),
  });
}

export function useDeletePurchaseAttachment(purchaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete<void>(`/purchases/attachments/${attachmentId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [KEY, "attachments", purchaseId] }),
  });
}
