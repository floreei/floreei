import type { ReportData } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function useReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", from, to],
    queryFn: () => api.get<ReportData>("/reports", { from, to }),
  });
}
