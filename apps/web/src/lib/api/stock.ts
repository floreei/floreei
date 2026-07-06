import type {
  StockAdjustInput,
  StockMovement,
  StockMovementInput,
  StockOverview,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

export function useStockOverview() {
  return useQuery({
    queryKey: ["stock", "overview"],
    queryFn: () => api.get<StockOverview>("/stock/overview"),
  });
}

export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: ["stock", "movements", productId],
    queryFn: () =>
      api.get<StockMovement[]>("/stock/movements", { productId }),
  });
}

export function useRegisterMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StockMovementInput) =>
      api.post<StockMovement>("/stock/movements", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }),
  });
}

/** Define o saldo do produto informando a quantidade real (contagem manual). */
export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StockAdjustInput) =>
      api.post<StockMovement | null>("/stock/adjust", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock"] }),
  });
}
