import type { SearchResult } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function useSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: ["search", term],
    queryFn: () => api.get<SearchResult[]>("/search", { q: term }),
    enabled: term.length >= 2,
    staleTime: 10_000,
  });
}
