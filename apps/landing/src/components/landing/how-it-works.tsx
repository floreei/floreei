import { steps } from "@/data/landing";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="section-y"
      style={{ background: "hsl(var(--secondary) / .5)" }}
    >
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Comece em minutos"
          title="Como funciona"
          subtitle="Sem instalação, sem manual. Você entra e já começa a usar."
        />
        <div className="mt-10 grid grid-cols-4 gap-5 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div className="h-full rounded-lg border border-border/70 bg-card p-6 shadow-card">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {s.n}
                </span>
                <h3 className="mt-4 text-[17px] font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
