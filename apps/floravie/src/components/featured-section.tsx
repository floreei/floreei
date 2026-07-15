"use client";

import Link from "next/link";
import { CATEGORY_EYEBROWS, CATEGORY_LABELS, type StoreCat } from "@/lib/types";
import { ProductCard } from "./product-card";
import { useProducts } from "./products-provider";

/**
 * Vitrine de destaque de uma categoria na home: grid (sem carrossel) com os
 * primeiros produtos + "Ver todos" que leva ao catálogo filtrado.
 */
export function FeaturedSection({
  cat,
  limit = 4,
}: {
  cat: StoreCat;
  limit?: number;
}) {
  const products = useProducts();
  const all = products.filter((p) => p.cat === cat);
  if (all.length === 0) return null;
  const items = all.slice(0, limit);

  return (
    <section className="block" id={cat}>
      <div className="wrap">
        <div className="block-head">
          <div>
            <span className="eyebrow">{CATEGORY_EYEBROWS[cat]}</span>
            <h2 className="display">{CATEGORY_LABELS[cat]}</h2>
          </div>
          <Link href={`/catalogo?cat=${cat}`} className="see-all">
            Ver todos
          </Link>
        </div>
        <div className="product-grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
