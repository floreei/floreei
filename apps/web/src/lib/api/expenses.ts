import type {
  Expense,
  ExpenseAttachment,
  ExpenseAttachmentInput,
  ExpenseInput,
  ExpenseQuery,
  Paginated,
  PayExpenseInput,
} from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const KEY = "expenses";

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [KEY] });
  qc.invalidateQueries({ queryKey: ["finance"] });
}

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
        status: query.status,
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
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/expenses/${id}`),
    onSuccess: () => invalidate(qc),
  });
}

export function usePayExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PayExpenseInput }) =>
      api.post<Expense>(`/expenses/${id}/pay`, input),
    onSuccess: () => invalidate(qc),
  });
}

export function useUnpayExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Expense>(`/expenses/${id}/unpay`),
    onSuccess: () => invalidate(qc),
  });
}

export function useAddExpenseAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      input,
    }: {
      expenseId: string;
      input: ExpenseAttachmentInput;
    }) => api.post<ExpenseAttachment>(`/expenses/${expenseId}/attachments`, input),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteExpenseAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      api.delete<void>(`/expenses/attachments/${attachmentId}`),
    onSuccess: () => invalidate(qc),
  });
}
