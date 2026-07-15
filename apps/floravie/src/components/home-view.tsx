"use client";

import { About } from "./about";
import { Benefits } from "./benefits";
import { Cities } from "./cities";
import { FeaturedSection } from "./featured-section";
import { Hero } from "./hero";
import { Newsletter } from "./newsletter";
import { Occasions } from "./occasions";
import { useProducts } from "./products-provider";

/** Conteúdo da home: hero + benefícios + vitrines de destaque por categoria
 * (grid, sem carrossel) + ocasiões + história + cidades + newsletter. */
export function HomeView() {
  const products = useProducts();
  const hasProducts = products.length > 0;

  return (
    <>
      <Hero />
      <Benefits />
      {hasProducts ? (
        <>
          <FeaturedSection cat="buques" />
          <Occasions />
          <FeaturedSection cat="arranjos" />
          <FeaturedSection cat="vasos" />
          <FeaturedSection cat="cestas" />
        </>
      ) : (
        <>
          <section className="block" id="buques">
            <div className="wrap">
              <div className="catalog-empty">
                <h2>Nossa vitrine está sendo preparada 🌷</h2>
                <p>Em breve, buquês e arranjos fresquinhos aqui. Volte logo!</p>
              </div>
            </div>
          </section>
          <Occasions />
        </>
      )}
      <About />
      <Cities />
      <Newsletter />
    </>
  );
}
