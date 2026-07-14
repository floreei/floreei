import { API_URL, STORE_SLUG } from "./config";
import type { Review } from "./types";

/** Avaliações aprovadas de um produto (chamada on-demand, ao abrir o modal). */
export async function fetchReviews(arrangementId: string): Promise<Review[]> {
  try {
    const res = await fetch(
      `${API_URL}/store/${STORE_SLUG}/arrangements/${arrangementId}/reviews`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    return (await res.json()) as Review[];
  } catch {
    return [];
  }
}

export type ReviewSubmission = {
  authorName: string;
  rating: number;
  comment?: string;
};

/** Envia uma avaliação. Retorna a review criada (aprovada) ou null em falha. */
export async function submitReview(
  arrangementId: string,
  input: ReviewSubmission,
): Promise<Review | null> {
  try {
    const res = await fetch(
      `${API_URL}/store/${STORE_SLUG}/arrangements/${arrangementId}/reviews`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as Review;
  } catch {
    return null;
  }
}
