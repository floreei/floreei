"use client";

import { Check } from "lucide-react";
import { useLandingData } from "@/lib/landing-data";
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
const WA_WAITLIST = whatsappWith(
  "Olá! As vagas de fundador acabaram — quero entrar na lista de espera do Floreei.",
);

/**
 * Oferta de early-access com escassez REAL: as vagas restantes vêm da API
 * (10 no total, consumidas por assinatura ou marcadas pelo gestor). Sem API,
 * mostra o texto genérico de vagas limitadas.
 */
export function FounderOffer() {
  const { founder } = useLandingData();
  const soldOut = founder !== null && founder.remaining <= 0;

  return (
    <section className="section-y">
      <div className="sf-wrap">
        <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/[0.05] p-8 text-center shadow-card sm:p-12">
          <p className="eyebrow">Oferta de fundador</p>
          <h2 className="sf-serif t-h3 mt-3 font-semibold leading-tight">
            {soldOut
              ? "As 10 vagas de fundador foram preenchidas"
              : "Entre agora e garanta condições de fundador"}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            {soldOut
              ? "Obrigado! A primeira turma está completa. Entre na lista de espera e avisamos quando abrir a próxima."
              : "Estamos abrindo as primeiras vagas. Quem entra agora ajuda a moldar o produto e leva condições que não vão se repetir."}
          </p>

          {!soldOut ? (
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
          ) : null}

          <div className="mt-9 flex flex-col items-center gap-3">
            <Cta href={soldOut ? WA_WAITLIST : WA} variant="clay">
              <WhatsappIcon className="h-5 w-5" />
              {soldOut
                ? "Entrar na lista de espera"
                : "Quero minha vaga de fundador"}
            </Cta>
            <p className="text-sm text-muted-foreground">
              {founder && !soldOut ? (
                <>
                  <span className="font-semibold text-foreground tabular-nums">
                    {founder.remaining === 1
                      ? "Resta 1 vaga"
                      : `Restam ${founder.remaining} vagas`}{" "}
                    de {founder.total}
                  </span>{" "}
                  · 7 dias grátis · sem fidelidade
                </>
              ) : soldOut ? (
                "7 dias grátis · sem fidelidade"
              ) : (
                "Vagas limitadas · 7 dias grátis · sem fidelidade"
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
