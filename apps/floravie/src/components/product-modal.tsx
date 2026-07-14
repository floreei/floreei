"use client";

import { money } from "@/lib/money";
import { FallbackImage } from "./fallback-image";
import { useProductLookup } from "./products-provider";
import { useStore } from "./store-provider";

export function ProductModal() {
  const {
    productOpen,
    pdSel,
    closeProduct,
    setSize,
    setQty,
    addToCart,
    openCart,
    startCheckout,
  } = useStore();

  const productById = useProductLookup();
  const p = pdSel.id ? productById(pdSel.id) : undefined;
  const price = p ? p.price + p.sizes[pdSel.sizeIdx].d : 0;

  return (
    <div
      className={`overlay${productOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do produto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeProduct();
      }}
    >
      <div className="sheet">
        <button className="close-x" onClick={closeProduct} aria-label="Fechar">
          ✕
        </button>
        {p && (
          <div className="pd">
            <div className="pd-img">
              {p.badge && <span className="badge">{p.badge}</span>}
              <FallbackImage src={p.img} alt={p.name} />
            </div>
            <div className="pd-info">
              <span className="eyebrow">
                {p.cat === "buques" ? "Buquês do Ateliê" : "Arranjos, Vasos & Cestas"}
              </span>
              <h2>{p.name}</h2>
              <div className="stars">
                {p.rating} <span>({p.reviews} avaliações)</span>
              </div>
              <div className="pd-price">
                {money(price * pdSel.qty)}
                <small>ou 3x de {money((price * pdSel.qty) / 3)} sem juros</small>
              </div>
              <p className="pd-desc">{p.desc}</p>
              <span className="opt-label">Tamanho</span>
              <div className="sizes">
                {p.sizes.map((s, i) => (
                  <button
                    key={s.l}
                    className={`size-btn${i === pdSel.sizeIdx ? " sel" : ""}`}
                    onClick={() => setSize(i)}
                  >
                    {s.l}
                    {s.d ? <small>+ {money(s.d)}</small> : <small>incluso</small>}
                  </button>
                ))}
              </div>
              <span className="opt-label">Quantidade</span>
              <div className="qty">
                <button onClick={() => setQty(-1)} aria-label="Diminuir">
                  −
                </button>
                <span>{pdSel.qty}</span>
                <button onClick={() => setQty(1)} aria-label="Aumentar">
                  +
                </button>
              </div>
              <div className="pd-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    addToCart();
                    closeProduct();
                    openCart();
                  }}
                >
                  Adicionar à sacola
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    addToCart();
                    closeProduct();
                    startCheckout();
                  }}
                >
                  Comprar agora
                </button>
              </div>
              <div className="pd-meta">
                <span>
                  🚚 <b>Hoje</b> para pedidos até 16h
                </span>
                <span>
                  ✍️ Cartão escrito à mão <b>grátis</b>
                </span>
                <span>🌱 Flores frescas do dia</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
