"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { money } from "@/lib/money";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type StoreCat,
} from "@/lib/types";
import { ProductCard } from "./product-card";
import { useProducts } from "./products-provider";

const PAGE_SIZE = 9;
type Sort = "relevancia" | "preco-asc" | "preco-desc" | "avaliacao";
type CatFilter = StoreCat | "all";

const SORT_LABELS: Record<Sort, string> = {
  relevancia: "Relevância",
  "preco-asc": "Menor preço",
  "preco-desc": "Maior preço",
  avaliacao: "Melhor avaliação",
};

function isCat(v: string | null): v is StoreCat {
  return v != null && (CATEGORY_ORDER as string[]).includes(v);
}

export function CatalogView() {
  const products = useProducts();
  const searchParams = useSearchParams();

  const [cat, setCat] = useState<CatFilter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("relevancia");
  const [page, setPage] = useState(1);

  // Teto de preço (arredondado pra cima em 50) — base do filtro de faixa.
  const ceiling = useMemo(() => {
    const max = products.reduce((m, p) => Math.max(m, p.price), 0);
    return Math.max(50, Math.ceil(max / 50) * 50);
  }, [products]);
  const [maxPrice, setMaxPrice] = useState<number>(ceiling);

  // Sincroniza categoria/busca a partir da URL (nav, "ver todos", busca).
  useEffect(() => {
    const urlCat = searchParams.get("cat");
    setCat(isCat(urlCat) ? urlCat : "all");
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Preço acompanha o teto quando o catálogo carrega.
  useEffect(() => setMaxPrice(ceiling), [ceiling]);

  // Volta à 1ª página quando qualquer filtro muda.
  useEffect(() => setPage(1), [cat, q, sort, maxPrice]);

  const filtered = useMemo(() => {
    let list = products.slice();
    if (cat !== "all") list = list.filter((p) => p.cat === cat);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.desc.toLowerCase().includes(term),
      );
    }
    if (maxPrice < ceiling) list = list.filter((p) => p.price <= maxPrice);
    if (sort === "preco-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "preco-desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "avaliacao") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, cat, q, maxPrice, ceiling, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const title = cat === "all" ? "Todo o catálogo" : CATEGORY_LABELS[cat];

  return (
    <section className="catalog">
      <div className="wrap">
        <div className="catalog-head">
          <span className="eyebrow">Catálogo</span>
          <h1 className="display">{title}</h1>
        </div>

        {/* Filtro de categoria */}
        <div className="filter-chips">
          <button
            className={`chip${cat === "all" ? " sel" : ""}`}
            onClick={() => setCat("all")}
          >
            Todos
          </button>
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              className={`chip${cat === c ? " sel" : ""}`}
              onClick={() => setCat(c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Busca, faixa de preço e ordenação */}
        <div className="filter-controls">
          <input
            className="filter-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome…"
            aria-label="Buscar no catálogo"
          />
          <label className="price-filter">
            <span>Até {money(maxPrice)}</span>
            <input
              type="range"
              min={50}
              max={ceiling}
              step={10}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="Preço máximo"
            />
          </label>
          <label className="sort-filter">
            <span>Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Ordenar por"
            >
              {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="catalog-count">
          {filtered.length}{" "}
          {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>

        {pageItems.length === 0 ? (
          <div className="catalog-empty">
            <h2>Nada encontrado por aqui 🌱</h2>
            <p>Tente outra categoria, ajuste a busca ou o preço.</p>
          </div>
        ) : (
          <div className="product-grid">
            {pageItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={safePage === 1}
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              aria-label="Página anterior"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`page-btn${n === safePage ? " sel" : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={safePage === totalPages}
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
              aria-label="Próxima página"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
