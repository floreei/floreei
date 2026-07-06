import type { StoreOrder } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function useStoreOrders() {
  return useQuery({
    queryKey: ["store-orders"],
    queryFn: () => api.get<StoreOrder[]>("/store-orders"),
    staleTime: 30_000,
  });
}
