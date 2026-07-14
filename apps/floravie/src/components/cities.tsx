import { CIDADES } from "@/lib/constants";

export function Cities() {
  return (
    <section className="cities" id="cidades">
      <div className="wrap">
        <span className="eyebrow">Onde entregamos</span>
        <h2 className="display">
          Entrega expressa na Região Metropolitana do Recife
        </h2>
        <p>
          Levamos flores frescas até você em poucas horas. Confira as cidades
          atendidas com entrega no mesmo dia:
        </p>
        <div className="city-list">
          {CIDADES.map((c) => (
            <a href="#" key={c}>
              {c}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
