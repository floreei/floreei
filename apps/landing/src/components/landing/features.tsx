import { features } from "@/data/landing";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Features() {
  return (
    <section id="funcionalidades" className="section-y">
      <div className="sf-wrap">
        <SectionHeading
          align="left"
          eyebrow="Tudo que a floricultura precisa"
          title="Um módulo para cada parte do seu negócio"
          subtitle="Do primeiro contato do cliente ao fechamento do caixa — sem pular de aplicativo em aplicativo."
        />
        <div className="mt-10 grid grid-cols-3 gap-5 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 70}>
              <div className="sf-feat h-full rounded-lg border border-border/70 bg-card p-[26px] shadow-card">
                <span
                  className="flex h-[46px] w-[46px] items-center justify-center rounded-md"
                  style={{ background: f.bg, color: f.fg }}
                >
                  <f.icon className="h-[22px] w-[22px]" />
                </span>
                <h3 className="mt-4 text-[19px] font-semibold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
