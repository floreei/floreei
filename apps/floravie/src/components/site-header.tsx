"use client";

import { useState } from "react";
import { useStore } from "./store-provider";
import { BagIcon, HeartIcon, SearchIcon } from "./icons";

type Cat = { label: string; href: string; drop?: { label: string; href: string }[] };

const CATS: Cat[] = [
  {
    label: "Buquês",
    href: "#buques",
    drop: [
      { label: "Buquês de Rosas", href: "#buques" },
      { label: "Buquês de Girassóis", href: "#buques" },
      { label: "Buquês de Lírios", href: "#buques" },
      { label: "Buquês de Flores do Campo", href: "#buques" },
      { label: "Buquês de Tulipas", href: "#buques" },
      { label: "Buquês Mistos do Ateliê", href: "#buques" },
    ],
  },
  {
    label: "Arranjos",
    href: "#cestas",
    drop: [
      { label: "Arranjos de Mesa", href: "#cestas" },
      { label: "Arranjos em Caixa", href: "#cestas" },
      { label: "Arranjos de Lírios", href: "#cestas" },
      { label: "Arranjos Tropicais", href: "#cestas" },
      { label: "Arranjos Corporativos", href: "#cestas" },
    ],
  },
  {
    label: "Flores em Vaso",
    href: "#cestas",
    drop: [
      { label: "Orquídeas", href: "#cestas" },
      { label: "Violetas", href: "#cestas" },
      { label: "Antúrios", href: "#cestas" },
      { label: "Suculentas & Verdes", href: "#cestas" },
      { label: "Kalanchoê (Flor da Fortuna)", href: "#cestas" },
    ],
  },
  {
    label: "Cestas de Presente",
    href: "#cestas",
    drop: [
      { label: "Café da Manhã", href: "#cestas" },
      { label: "Chocolates & Doces", href: "#cestas" },
      { label: "Vinhos & Queijos", href: "#cestas" },
      { label: "Flores & Pelúcia", href: "#cestas" },
      { label: "Cestas Especiais", href: "#cestas" },
    ],
  },
  {
    label: "Ocasiões",
    href: "#ocasioes",
    drop: [
      { label: "Aniversário", href: "#ocasioes" },
      { label: "Amor & Romance", href: "#ocasioes" },
      { label: "Agradecimento", href: "#ocasioes" },
      { label: "Maternidade", href: "#ocasioes" },
      { label: "Melhoras", href: "#ocasioes" },
      { label: "Condolências", href: "#ocasioes" },
    ],
  },
  { label: "Onde entregamos", href: "#cidades" },
];

export function SiteHeader() {
  const { cartQty, openCart } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="wrap">
          <span className="topbar-msg">
            Entrega no mesmo dia em Recife e região · Pedidos até 16h
          </span>
          <div className="topbar-links">
            <a href="#">Minha conta</a>
            <a href="#">Acompanhar pedido</a>
            <a href="#">Ajuda</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="site">
        <div className="wrap header-row">
          <button
            className="menu-toggle"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <a href="#" className="logo" aria-label="Floravie Ateliê — página inicial">
            <span className="name">
              Flora<em>vie</em>
            </span>
            <span className="tag">Ateliê Floral</span>
          </a>
          <form
            className="search"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="search"
              placeholder="Buscar buquês, arranjos, cestas…"
              aria-label="Buscar produtos"
            />
            <button aria-label="Buscar">
              <SearchIcon />
            </button>
          </form>
          <div className="header-actions">
            <button className="h-action" type="button">
              <HeartIcon />
              Favoritos
            </button>
            <button className="h-action" type="button" onClick={openCart}>
              <BagIcon />
              Sacola
              <span className="cart-count">{cartQty}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegação de categorias */}
      <nav className={`cats${menuOpen ? " open" : ""}`} aria-label="Categorias">
        <div className="wrap">
          <ul>
            {CATS.map((cat) => (
              <li className="cat" key={cat.label}>
                <a href={cat.href}>{cat.label}</a>
                {cat.drop && (
                  <ul className="drop">
                    {cat.drop.map((d) => (
                      <li key={d.label}>
                        <a href={d.href}>{d.label}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
