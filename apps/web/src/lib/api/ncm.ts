import type { NcmEntry, NcmSuggestion, NcmValidation } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

const KEY = "ncm";

export function useNcmSearch(term: string) {
  return useQuery({
    queryKey: [KEY, "search", term],
    queryFn: () => api.get<NcmEntry[]>("/ncm/search", { q: term }),
    enabled: term.trim().length > 0,
    staleTime: 5 * 60_000,
  });
}

export function useNcmSuggestions() {
  return useQuery({
    queryKey: [KEY, "suggestions"],
    queryFn: () => api.get<NcmSuggestion[]>("/ncm/suggestions"),
    staleTime: 5 * 60_000,
  });
}

export function useNcmValidate(code: string | undefined) {
  return useQuery({
    queryKey: [KEY, "validate", code],
    queryFn: () => api.get<NcmValidation>(`/ncm/${code}/validate`),
    enabled: Boolean(code && /^\d{8}$/.test(code)),
    staleTime: 5 * 60_000,
  });
}
