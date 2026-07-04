import type {
  Category,
  CategoryInput,
  Paginated,
  Product,
  ProductInput,
  ProductQuery,
} from "@sistema-flores/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";

const CATEGORIES = "categories";
const PRODUCTS = "products";

export function useCategories() {
  return useQuery({
    queryKey: [CATEGORIES],
    queryFn: () => api.get<Category[]>("/categories"),
  });
}

export function useSaveCategory(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) =>
      id
        ? api.patch<Category>(`/categories/${id}`, input)
        : api.post<Category>("/categories", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CATEGORIES] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES] });
      qc.invalidateQueries({ queryKey: [PRODUCTS] });
    },
  });
}

export function useProducts(query: Partial<ProductQuery> = {}) {
  return useQuery({
    queryKey: [PRODUCTS, query],
    queryFn: () =>
      api.get<Paginated<Product>>("/products", {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        search: query.search,
        categoryId: query.categoryId,
        onlyActive: query.onlyActive,
      }),
  });
}

export function useSaveProduct(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      id
        ? api.patch<Product>(`/products/${id}`, input)
        : api.post<Product>("/products", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS] });
      qc.invalidateQueries({ queryKey: [CATEGORIES] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS] });
      qc.invalidateQueries({ queryKey: [CATEGORIES] });
    },
  });
}
