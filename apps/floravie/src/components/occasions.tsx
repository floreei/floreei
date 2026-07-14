const OCCASIONS = [
  { label: "Amor & Romance", href: "#buques", img: "/images/occ-amor.jpg" },
  { label: "Aniversário", href: "#buques", img: "/images/occ-aniversario.jpg" },
  { label: "Agradecimento", href: "#buques", img: "/images/sobre.jpg" },
  { label: "Maternidade", href: "#cestas", img: "/images/occ-maternidade.jpg" },
  { label: "Melhoras", href: "#cestas", img: "/images/occ-melhoras.jpg" },
  { label: "Dia das Mães", href: "#buques", img: "/images/occ-dia-das-maes.jpg" },
  { label: "Corporativo", href: "#cestas", img: "/images/occ-corporativo.jpg" },
  { label: "Condolências", href: "#buques", img: "/images/occ-condolencias.jpg" },
];

export function Occasions() {
  return (
    <section className="occasions" id="ocasioes">
      <div className="wrap">
        <div className="block-head" style={{ marginBottom: 0 }}>
          <div>
            <span className="eyebrow">Cada momento pede uma flor</span>
            <h2 className="display">Presenteie por ocasião</h2>
          </div>
          <a href="#" className="see-all">
            Ver todas
          </a>
        </div>
        <div className="occ-grid">
          {OCCASIONS.map((o) => (
            <a
              key={o.label}
              href={o.href}
              className="occ"
              style={{ backgroundImage: `url('${o.img}')` }}
            >
              <span>{o.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
