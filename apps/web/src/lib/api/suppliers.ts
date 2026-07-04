import type {
  Paginated,
  Supplier,
  SupplierInput,
  SupplierProfile,
  SupplierQuery,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const KEY = "suppliers";

export function useSuppliers(query: Partial<SupplierQuery> = {}) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () =>
      api.get<Paginated<Supplier>>("/suppliers", {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 100,
        search: query.search,
      }),
  });
}

export function useSupplierProfile(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "profile", id],
    queryFn: () => api.get<SupplierProfile>(`/suppliers/${id}/profile`),
    enabled: Boolean(id),
  });
}

export function useSaveSupplier(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupplierInput) =>
      id
        ? api.patch<Supplier>(`/suppliers/${id}`, input)
        : api.post<Supplier>("/suppliers", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
