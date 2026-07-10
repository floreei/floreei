import { Star } from "lucide-react";
import { Reveal } from "./reveal";

/** Rostos da comunidade (troque por fotos reais de clientes quando tiver). */
const AVATARS = [
  { initials: "MF", bg: "hsl(var(--primary))" },
  { initials: "RC", bg: "hsl(var(--clay))" },
  { initials: "JS", bg: "hsl(var(--chart-3))" },
  { initials: "AL", bg: "hsl(var(--success))" },
  { initials: "PN", bg: "hsl(var(--chart-5))" },
];

/** Âncoras quantitativas — honestas, sobre o que o produto entrega. */
const STATS = [
  { n: "1 lugar só", d: "Clientes, orçamentos, estoque e financeiro" },
  { n: "0 planilhas", d: "Chega de Excel e caderninho" },
  { n: "~2 min", d: "Para montar um orçamento completo" },
  { n: "100% pt-BR", d: "Feito para a floricultura brasileira" },
];

export function SocialProof() {
  return (
    <section className="border-y border-border bg-secondary/40 py-12">
      <div className="sf-wrap">
        <Reveal>
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:gap-5 sm:text-left">
            <div className="flex -space-x-3">
              {AVATARS.map((a) => (
                <span
                  key={a.initials}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white"
                  style={{ background: a.bg }}
                >
                  {a.initials}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-start">
              <span className="flex gap-0.5 text-clay">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4" fill="currentColor" />
                ))}
              </span>
              <span className="text-[15px] text-muted-foreground">
                <strong className="font-semibold text-foreground">
                  Floriculturas, floristas e decoradores
                </strong>{" "}
                confiam no Floreei no dia a dia
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border/70 pt-10 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div className="text-center">
                <p className="sf-serif text-[1.9rem] font-semibold leading-none text-primary">
                  {s.n}
                </p>
                <p className="mx-auto mt-2.5 max-w-[13rem] text-sm leading-snug text-muted-foreground">
                  {s.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
