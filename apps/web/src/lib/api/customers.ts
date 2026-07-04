import type {
  Customer,
  CustomerInput,
  CustomerProfile,
  CustomerQuery,
  Paginated,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const KEY = "customers";

export function useCustomers(query: Partial<CustomerQuery> = {}) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () =>
      api.get<Paginated<Customer>>("/customers", {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        search: query.search,
      }),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCustomerProfile(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "profile", id],
    queryFn: () => api.get<CustomerProfile>(`/customers/${id}/profile`),
    enabled: Boolean(id),
  });
}

export function useSaveCustomer(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      id
        ? api.patch<Customer>(`/customers/${id}`, input)
        : api.post<Customer>("/customers", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
