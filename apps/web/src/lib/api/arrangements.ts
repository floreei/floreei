import type {
  Arrangement,
  ArrangementInput,
  ArrangementQuery,
  Paginated,
} from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const ARRANGEMENTS = "arrangements";

export function useArrangements(query: Partial<ArrangementQuery> = {}) {
  return useQuery({
    queryKey: [ARRANGEMENTS, query],
    queryFn: () =>
      api.get<Paginated<Arrangement>>("/arrangements", {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        search: query.search,
        categoryId: query.categoryId,
        onlyActive: query.onlyActive,
      }),
  });
}

export function useSaveArrangement(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ArrangementInput) =>
      id
        ? api.patch<Arrangement>(`/arrangements/${id}`, input)
        : api.post<Arrangement>("/arrangements", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ARRANGEMENTS] });
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
}

export function useDeleteArrangement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/arrangements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ARRANGEMENTS] }),
  });
}
