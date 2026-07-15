"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "./store-provider";
import { BagIcon, HeartIcon, SearchIcon } from "./icons";

type Drop = { label: string; href: string };
type Cat = { label: string; href: string; drop?: Drop[] };

// Submenus levam à categoria já filtrada; alguns pré-preenchem a busca (q=).
const CATS: Cat[] = [
  {
    label: "Buquês",
    href: "/catalogo?cat=buques",
    drop: [
      { label: "Buquês de Rosas", href: "/catalogo?cat=buques&q=rosas" },
      { label: "Buquês de Girassóis", href: "/catalogo?cat=buques&q=girass" },
      { label: "Flores do Campo", href: "/catalogo?cat=buques&q=campo" },
      { label: "Jardim Tropical", href: "/catalogo?cat=buques&q=tropical" },
      { label: "Serenidade Branca", href: "/catalogo?cat=buques&q=branca" },
      { label: "Todos os buquês", href: "/catalogo?cat=buques" },
    ],
  },
  {
    label: "Arranjos",
    href: "/catalogo?cat=arranjos",
    drop: [
      { label: "Arranjos de Mesa", href: "/catalogo?cat=arranjos" },
      { label: "Arranjos em Caixa", href: "/catalogo?cat=arranjos" },
      { label: "Todos os arranjos", href: "/catalogo?cat=arranjos" },
    ],
  },
  {
    label: "Flores em Vaso",
    href: "/catalogo?cat=vasos",
    drop: [
      { label: "Orquídeas", href: "/catalogo?cat=vasos&q=orqu" },
      { label: "Plantas & Verdes", href: "/catalogo?cat=vasos" },
      { label: "Todas as flores em vaso", href: "/catalogo?cat=vasos" },
    ],
  },
  {
    label: "Cestas de Presente",
    href: "/catalogo?cat=cestas",
    drop: [
      { label: "Café da Manhã", href: "/catalogo?cat=cestas&q=bom%20dia" },
      { label: "Vinhos & Delícias", href: "/catalogo?cat=cestas&q=vinho" },
      { label: "Flores & Pelúcia", href: "/catalogo?cat=cestas&q=pel" },
      { label: "Todas as cestas", href: "/catalogo?cat=cestas" },
    ],
  },
  { label: "Ocasiões", href: "/#ocasioes" },
  { label: "Onde entregamos", href: "/#cidades" },
];

export function SiteHeader() {
  const { cartQty, openCart } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input");
    const value = input ? (input as HTMLInputElement).value.trim() : "";
    router.push(value ? `/catalogo?q=${encodeURIComponent(value)}` : "/catalogo");
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="wrap">
          <span className="topbar-msg">
            Entrega no mesmo dia em Recife e região · Pedidos até 16h
          </span>
          <div className="topbar-links">
            <Link href="/catalogo">Ver catálogo</Link>
            <Link href="/#cidades">Onde entregamos</Link>
            <Link href="/#ocasioes">Ocasiões</Link>
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
          <Link href="/" className="logo" aria-label="Floravie Ateliê — página inicial">
            <span className="name">
              Flora<em>vie</em>
            </span>
            <span className="tag">Ateliê Floral</span>
          </Link>
          <form className="search" role="search" onSubmit={onSearch}>
            <input
              type="search"
              name="q"
              placeholder="Buscar buquês, arranjos, cestas…"
              aria-label="Buscar produtos"
            />
            <button aria-label="Buscar">
              <SearchIcon />
            </button>
          </form>
          <div className="header-actions">
            <Link href="/catalogo" className="h-action">
              <HeartIcon />
              Catálogo
            </Link>
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
                <Link href={cat.href}>{cat.label}</Link>
                {cat.drop && (
                  <ul className="drop">
                    {cat.drop.map((d) => (
                      <li key={d.label}>
                        <Link href={d.href}>{d.label}</Link>
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
