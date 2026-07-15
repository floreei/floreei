"use client";

import { useRouter } from "next/navigation";
import { FallbackImage } from "./fallback-image";
import { CheckNoteIcon, PinIcon } from "./icons";

export function Hero() {
  const router = useRouter();
  return (
    <section className="hero">
      <div className="wrap">
        <div>
          <span className="eyebrow">Feito à mão, entregue com carinho</span>
          <h1 className="display">
            Para quem vai <em>florescer</em> o seu dia?
          </h1>
          <p className="lead">
            Buquês, arranjos e cestas montados no nosso ateliê com flores frescas do
            dia. Diga para onde vai e nós cuidamos do resto.
          </p>
          <form
            className="delivery"
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/catalogo");
            }}
          >
            <PinIcon />
            <input
              type="text"
              placeholder="Digite o endereço de entrega… Ex.: Av. Boa Viagem, 1000"
              aria-label="Endereço de entrega"
            />
            <button type="submit">Ver opções</button>
          </form>
          <p className="hero-note">
            <CheckNoteIcon />
            <span>
              Pedidos confirmados até <b>16h</b> chegam <b>hoje mesmo</b>.
            </span>
          </p>
        </div>
        <div className="hero-art">
          <span className="petal"></span>
          <span className="petal"></span>
          <span className="petal"></span>
          <div className="hero-photo">
            <FallbackImage
              src="/images/hero.jpg"
              alt="Buquê de flores em tons de rosa e vermelho em vaso de vidro"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
