import type { DashboardSummary, FirstSteps } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/dashboard/summary"),
  });
}

/** Checklist de primeiros passos (onboarding). */
export function useFirstSteps(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "first-steps"],
    queryFn: () => api.get<FirstSteps>("/dashboard/first-steps"),
    enabled,
    staleTime: 30_000,
  });
}
