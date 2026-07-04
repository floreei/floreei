import type { DashboardSummary } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/dashboard/summary"),
  });
}
