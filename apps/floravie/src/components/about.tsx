import { FallbackImage } from "./fallback-image";

export function About() {
  return (
    <section className="about">
      <div className="wrap">
        <div className="about-art">
          <FallbackImage
            src="/images/sobre.jpg"
            alt="Buquê de flores sobre mesa de madeira no ateliê"
          />
        </div>
        <div>
          <span className="eyebrow">Nossa história</span>
          <h2 className="display">Um ateliê onde cada flor conta uma história</h2>
          <p>
            A Floravie nasceu do desejo de transformar momentos comuns em memórias
            afetivas. Aqui, nada sai em série: cada buquê é desenhado, montado e
            finalizado à mão, com flores selecionadas na manhã da entrega.
          </p>
          <p>
            Do cartão escrito à mão ao laço final, cuidamos de cada detalhe para que o
            seu presente chegue exatamente como você imaginou — ou ainda mais bonito.
          </p>
          <a href="#buques" className="cta">
            Conheça o ateliê
          </a>
        </div>
      </div>
    </section>
  );
}
