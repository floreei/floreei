"use client";

import { money } from "@/lib/money";
import type { Product } from "@/lib/types";
import { FallbackImage } from "./fallback-image";
import { Stars } from "./stars";
import { useStore } from "./store-provider";

export function ProductCard({ product: p }: { product: Product }) {
  const { openProduct, quickAdd } = useStore();

  return (
    <article className="card" onClick={() => openProduct(p.id)}>
      <div className="ph">
        {p.badge && <span className="badge">{p.badge}</span>}
        <FallbackImage src={p.img} alt={p.name} />
      </div>
      <div className="info">
        <h3>{p.name}</h3>
        <div className="stars">
          <Stars rating={p.rating} />{" "}
          <span className="star-count">({p.reviews})</span>
        </div>
        <div className="price-row">
          <span className="price">{money(p.price)}</span>
          <span className="installments">3x de {money(p.price / 3)}</span>
        </div>
      </div>
      <button
        className="buy"
        onClick={(e) => {
          e.stopPropagation();
          quickAdd(p.id);
        }}
      >
        Adicionar à sacola
      </button>
    </article>
  );
}
