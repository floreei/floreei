import { Check } from "lucide-react";
import { steps } from "@/data/landing";
import { PhotoBadge } from "./photo-badge";
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
          align="left"
        />
        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <Reveal
            variant="scale"
            className="relative mx-auto max-w-md lg:mx-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/landing/como-funciona.webp"
              alt="Equipe usando o Floreei em um laptop"
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg"
              loading="lazy"
            />
            <PhotoBadge
              icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
              title="Equipe treinada no 1º dia"
              delay={280}
              className="-bottom-5 left-5"
            />
          </Reveal>

          <div className="space-y-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} variant="right" delay={i * 90}>
                <div className="flex gap-4 rounded-lg border border-border/70 bg-card p-5 shadow-card">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-semibold">{s.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
