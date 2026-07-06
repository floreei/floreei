import type {
  CompanySettings,
  CompanySettingsInput,
  StoreSettings,
  StoreSettingsInput,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: () => api.get<CompanySettings>("/company"),
    staleTime: 60_000,
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompanySettingsInput) =>
      api.patch<CompanySettings>("/company", input),
    onSuccess: (data) => qc.setQueryData(["company"], data),
  });
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ["company", "store"],
    queryFn: () => api.get<StoreSettings>("/company/store"),
    staleTime: 60_000,
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StoreSettingsInput) =>
      api.patch<StoreSettings>("/company/store", input),
    onSuccess: (data) => qc.setQueryData(["company", "store"], data),
  });
}
