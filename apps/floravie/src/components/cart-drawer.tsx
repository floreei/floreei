"use client";

import { FRETE_GRATIS } from "@/lib/constants";
import { money } from "@/lib/money";
import { BagBigIcon } from "./icons";
import { FallbackImage } from "./fallback-image";
import { useProductLookup } from "./products-provider";
import { useStore } from "./store-provider";

export function CartDrawer() {
  const {
    cart,
    cartOpen,
    closeCart,
    chQty,
    removeItem,
    itemPrice,
    subtotal,
    frete,
    openCheckout,
  } = useStore();
  const productById = useProductLookup();

  const faltam = FRETE_GRATIS - subtotal;

  return (
    <>
      <div
        className={`overlay${cartOpen ? " open" : ""}`}
        style={{ background: "rgba(38,51,44,.35)" }}
        onClick={closeCart}
      />
      <aside
        className={`drawer${cartOpen ? " open" : ""}`}
        aria-label="Sacola de compras"
      >
        <div className="drawer-head">
          <h3>Sua sacola</h3>
          <button
            className="close-x"
            style={{ position: "static" }}
            onClick={closeCart}
            aria-label="Fechar sacola"
          >
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <BagBigIcon />
              <p>
                Sua sacola está vazia.
                <br />
                Que tal escolher umas flores?
              </p>
            </div>
          ) : (
            cart.map((c, i) => {
              const p = productById(c.id);
              if (!p) return null;
              return (
                <div className="ci" key={`${c.id}-${c.sizeIdx}`}>
                  <FallbackImage src={p.img} alt={p.name} />
                  <div>
                    <h4>{p.name}</h4>
                    <div className="ci-size">{p.sizes[c.sizeIdx].l}</div>
                    <div className="ci-price">{money(itemPrice(c) * c.qty)}</div>
                    <button className="ci-remove" onClick={() => removeItem(i)}>
                      remover
                    </button>
                  </div>
                  <div className="ci-qty">
                    <button onClick={() => chQty(i, -1)} aria-label="Diminuir">
                      −
                    </button>
                    {c.qty}
                    <button onClick={() => chQty(i, 1)} aria-label="Aumentar">
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-foot">
            {faltam > 0 ? (
              <div className="free-ship">
                Faltam <b>{money(faltam)}</b> para frete grátis 🚚
              </div>
            ) : (
              <div className="free-ship">
                Você ganhou <b>frete grátis</b>! 🎉
              </div>
            )}
            <div className="sumline">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="sumline">
              <span>Frete</span>
              <span>{frete === 0 ? "Grátis" : money(frete)}</span>
            </div>
            <div className="sumline total">
              <span>Total</span>
              <span>{money(subtotal + frete)}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                closeCart();
                openCheckout();
              }}
            >
              Finalizar pedido
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
