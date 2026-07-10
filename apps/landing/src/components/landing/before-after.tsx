import { Check, X } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

/** A dor de NÃO ter o sistema (aversão à perda). */
const SEM = [
  "Orçamentos no caderno e no WhatsApp, fáceis de perder",
  "Estoque no escuro: compra demais ou falta na hora da venda",
  "Vende sem saber a margem — o lucro escapa sem você ver",
  "Cliente esperando enquanto você procura preço e disponibilidade",
  "Fim do mês no susto, sem saber quanto entrou e quanto saiu",
];

/** O alívio de ter (posse — imagine já usando). */
const COM = [
  "Cada orçamento e venda registrados, do jeito certo",
  "Estoque na palma da mão, com alerta do que está acabando",
  "Margem clara em cada buquê e em cada venda",
  "Responde na hora, com preço e ficha técnica prontos",
  "Caixa e financeiro sempre em dia, sem surpresa",
];

export function BeforeAfter() {
  return (
    <section className="section-y">
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Antes e depois"
          title="A desorganização custa caro — em tempo, vendas e lucro"
          subtitle="Veja o que muda na sua floricultura no dia em que tudo passa a ficar num lugar só."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal variant="left">
            <div className="h-full rounded-2xl border border-border/70 bg-card p-7 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Sem um sistema
              </p>
              <ul className="mt-5 space-y-3.5">
                {SEM.map((s) => (
                  <li
                    key={s}
                    className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <X className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal variant="right" delay={90}>
            <div className="h-full rounded-2xl border border-primary/20 bg-primary/[0.04] p-7 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                Com o Floreei
              </p>
              <ul className="mt-5 space-y-3.5">
                {COM.map((s) => (
                  <li
                    key={s}
                    className="flex gap-3 text-[15px] leading-relaxed text-foreground"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
