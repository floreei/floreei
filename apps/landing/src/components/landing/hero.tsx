import { Check } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/site";
import { Cta } from "./cta";
import { HeroPhoto } from "./hero-photo";
import { WhatsappIcon } from "./icons";
import { Reveal } from "./reveal";

const SELOS = ["Sem instalação", "Suporte em português", "Cancele quando quiser"];

export function Hero() {
  return (
    <section className="relative">
      {/* Fundo decorativo — overflow isolado aqui, sem cortar os selos da foto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 88% -10%, hsl(var(--accent)) 0, transparent 42%)",
          }}
        />
        <span
          className="sf-blob absolute -left-16 top-24 h-64 w-64 rounded-full"
          style={{ background: "hsl(var(--primary) / .06)" }}
        />
        <span
          className="sf-blob2 absolute right-10 top-4 h-40 w-40 rounded-full"
          style={{ background: "hsl(var(--clay) / .08)" }}
        />
      </div>

      <div className="sf-wrap section-y relative grid grid-cols-[1.05fr_.95fr] items-center gap-14 max-[1024px]:grid-cols-1 max-[1024px]:gap-10">
        <div>
          <Reveal amount={0}>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary py-1.5 pl-1.5 pr-4 text-sm font-medium">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              Para floriculturas, floristas, atacado e eventos
            </span>
          </Reveal>

          <Reveal amount={0} delay={80}>
            <h1 className="sf-serif t-hero mt-6 font-semibold leading-[1.05]">
              Do orçamento ao caixa, tudo em um só lugar.
            </h1>
          </Reveal>

          <Reveal amount={0} delay={160}>
            <p className="mt-5 max-w-[30rem] text-[19px] leading-relaxed text-muted-foreground">
              O Floreei é o sistema que organiza clientes, orçamentos, eventos,
              estoque e financeiro da sua floricultura — com telas simples que
              qualquer pessoa da equipe aprende a usar.
            </p>
          </Reveal>

          <Reveal amount={0} delay={240}>
            <div className="mt-7 flex flex-wrap gap-3">
              <Cta href={WHATSAPP_LINK} variant="clay">
                <WhatsappIcon className="h-5 w-5" />
                Falar com um especialista
              </Cta>
              <Cta href="#funcionalidades" variant="outline">
                Ver funcionalidades
              </Cta>
            </div>

            <p className="mt-3.5 text-sm text-muted-foreground">
              Resposta no mesmo dia, pelo WhatsApp · sem cartão, sem compromisso
            </p>
          </Reveal>

          <Reveal amount={0} delay={320}>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {SELOS.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                  {s}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal variant="scale" delay={200} amount={0}>
          <HeroPhoto />
        </Reveal>
      </div>
    </section>
  );
}
