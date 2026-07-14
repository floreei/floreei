import type {
  Paginated,
  Review,
  ReviewStatus,
} from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

const KEY = "reviews";

export function useReviews(params: { status?: ReviewStatus; page?: number }) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  const query = qs.toString();
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () =>
      api.get<Paginated<Review>>(`/reviews${query ? `?${query}` : ""}`),
  });
}

export function useSetReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: ReviewStatus }) =>
      api.patch<Review>(`/reviews/${input.id}`, { status: input.status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
