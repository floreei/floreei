"use client";

import { useStore } from "./store-provider";

export function Newsletter() {
  const { showToast } = useStore();

  return (
    <section className="news">
      <div className="wrap">
        <div>
          <h2>
            Receba <em>flores</em> na sua caixa de entrada
          </h2>
          <p>
            Cupons exclusivos, lançamentos do ateliê e lembretes de datas especiais.
            Sem spam, prometido.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            (e.currentTarget.querySelector("input") as HTMLInputElement).value = "";
            showToast("Obrigado! Você receberá nossas novidades 🌸");
          }}
        >
          <input
            type="email"
            required
            placeholder="Seu melhor e-mail"
            aria-label="E-mail para newsletter"
          />
          <button type="submit">Assinar</button>
        </form>
      </div>
    </section>
  );
}
