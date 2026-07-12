import type {
  DunningLogEntry,
  DunningSettings,
  DunningSettingsInput,
} from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const KEY = "dunning";

export function useDunningSettings() {
  return useQuery({
    queryKey: [KEY, "settings"],
    queryFn: () => api.get<DunningSettings>("/dunning/settings"),
  });
}

export function useUpdateDunningSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DunningSettingsInput) =>
      api.patch<DunningSettings>("/dunning/settings", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDunningLog() {
  return useQuery({
    queryKey: [KEY, "log"],
    queryFn: () => api.get<DunningLogEntry[]>("/dunning/log"),
  });
}
