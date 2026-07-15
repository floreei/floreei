import Link from "next/link";

// Ocasiões são inspiração; levam ao catálogo (não há tag de ocasião nos dados —
// a categoria mais próxima pré-filtra a listagem).
const OCCASIONS = [
  { label: "Amor & Romance", href: "/catalogo?cat=buques", img: "/images/occ-amor.jpg" },
  { label: "Aniversário", href: "/catalogo?cat=buques", img: "/images/occ-aniversario.jpg" },
  { label: "Agradecimento", href: "/catalogo?cat=arranjos", img: "/images/sobre.jpg" },
  { label: "Maternidade", href: "/catalogo?cat=cestas", img: "/images/occ-maternidade.jpg" },
  { label: "Melhoras", href: "/catalogo?cat=vasos", img: "/images/occ-melhoras.jpg" },
  { label: "Dia das Mães", href: "/catalogo?cat=buques", img: "/images/occ-dia-das-maes.jpg" },
  { label: "Corporativo", href: "/catalogo?cat=arranjos", img: "/images/occ-corporativo.jpg" },
  { label: "Condolências", href: "/catalogo?cat=arranjos", img: "/images/occ-condolencias.jpg" },
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
          <Link href="/catalogo" className="see-all">
            Ver todas
          </Link>
        </div>
        <div className="occ-grid">
          {OCCASIONS.map((o) => (
            <Link
              key={o.label}
              href={o.href}
              className="occ"
              style={{ backgroundImage: `url('${o.img}')` }}
            >
              <span>{o.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
