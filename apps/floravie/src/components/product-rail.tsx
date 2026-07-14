"use client";

import { useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";
import { ProductCard } from "./product-card";
import { useProducts } from "./products-provider";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  cat: "buques" | "cestas";
};

export function ProductRail({ id, eyebrow, title, cat }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const products = useProducts();
  const items = products.filter((p) => p.cat === cat);

  const slide = (dir: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".card");
    const step = (card ? card.offsetWidth : 280) + 22;
    rail.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="block" id={id}>
      <div className="wrap">
        <div className="block-head">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 className="display">{title}</h2>
          </div>
          <a href="#" className="see-all">
            Ver todos
          </a>
        </div>
        <div className="rail-zone">
          <button
            className="rail-btn prev"
            aria-label="Anterior"
            onClick={() => slide(-1)}
          >
            <ArrowLeftIcon />
          </button>
          <div className="rail" ref={railRef}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <button
            className="rail-btn next"
            aria-label="Próximo"
            onClick={() => slide(1)}
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
