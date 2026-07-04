import type {
  Expense,
  ExpenseInput,
  ExpenseQuery,
  Paginated,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const KEY = "expenses";

export function useExpenses(query: Partial<ExpenseQuery> = {}) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () =>
      api.get<Paginated<Expense>>("/expenses", {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        from: query.from,
        to: query.to,
        costCenter: query.costCenter,
      }),
  });
}

export function useSaveExpense(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) =>
      id
        ? api.patch<Expense>(`/expenses/${id}`, input)
        : api.post<Expense>("/expenses", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}
