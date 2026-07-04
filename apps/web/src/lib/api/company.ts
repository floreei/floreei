import type {
  CompanySettings,
  CompanySettingsInput,
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
