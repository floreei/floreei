import type { Paginated, StoreOrder, StoreOrderQuery } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function useStoreOrders(query: Partial<StoreOrderQuery> = {}) {
  return useQuery({
    queryKey: ["store-orders", query],
    queryFn: () =>
      api.get<Paginated<StoreOrder>>("/store-orders", {
        page: query.page ?? 1,
        sort: query.sort,
        order: query.order,
        pageSize: query.pageSize ?? 20,
        search: query.search,
        status: query.status,
        from: query.from,
        to: query.to,
      }),
    staleTime: 30_000,
  });
}
