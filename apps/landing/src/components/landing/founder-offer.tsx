import { Check } from "lucide-react";
import { whatsappWith } from "@/lib/site";
import { Cta } from "./cta";
import { WhatsappIcon } from "./icons";

const PERKS = [
  "Preço de fundador travado — sem reajuste-surpresa depois",
  "Configuração feita por nós: cadastramos seus produtos e preços",
  "Sua loja online no ar, para vender no Pix e no cartão",
  "Fale direto com quem faz o Floreei",
];

const WA = whatsappWith(
  "Olá! Quero garantir minha vaga de fundador no Floreei.",
);

/** Oferta de early-access com escassez — gatilho de conversão dos primeiros clientes. */
export function FounderOffer() {
  return (
    <section className="section-y">
      <div className="sf-wrap">
        <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/[0.05] p-8 text-center shadow-card sm:p-12">
          <p className="eyebrow">Oferta de fundador</p>
          <h2 className="sf-serif t-h3 mt-3 font-semibold leading-tight">
            Entre agora e garanta condições de fundador
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Estamos abrindo as primeiras vagas. Quem entra agora ajuda a moldar o
            produto e leva condições que não vão se repetir.
          </p>

          <ul className="mx-auto mt-7 grid max-w-xl gap-3 text-left sm:grid-cols-2">
            {PERKS.map((p) => (
              <li key={p} className="flex gap-2.5 text-[15px] leading-snug">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col items-center gap-3">
            <Cta href={WA} variant="clay">
              <WhatsappIcon className="h-5 w-5" />
              Quero minha vaga de fundador
            </Cta>
            <p className="text-sm text-muted-foreground">
              Vagas limitadas · 7 dias grátis · sem fidelidade
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
