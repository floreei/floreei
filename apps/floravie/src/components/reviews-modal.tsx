"use client";

import { CATEGORY_LABELS } from "@/lib/types";
import { ProductReviews } from "./product-reviews";
import { useProductLookup } from "./products-provider";
import { useStore } from "./store-provider";

/**
 * Modal dedicado de avaliações, aberto por cima do modal de produto (z-index
 * maior). Mantém o modal de produto enxuto — a lista rola no próprio sheet, sem
 * esticar a foto do produto.
 */
export function ReviewsModal() {
  const { reviewsOpen, closeReviews, pdSel } = useStore();
  const productById = useProductLookup();
  const p = pdSel.id ? productById(pdSel.id) : undefined;

  return (
    <div
      className={`overlay reviews-overlay${reviewsOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Avaliações do produto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeReviews();
      }}
    >
      <div className="sheet reviews-sheet">
        <button className="close-x" onClick={closeReviews} aria-label="Fechar">
          ✕
        </button>
        {reviewsOpen && p && (
          <div className="reviews-modal-body">
            <span className="eyebrow">{CATEGORY_LABELS[p.cat]}</span>
            <h2 className="reviews-modal-title">{p.name}</h2>
            <ProductReviews
              productId={p.id}
              rating={p.rating}
              reviews={p.reviews}
            />
          </div>
        )}
      </div>
    </div>
  );
}
