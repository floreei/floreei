"use client";

import { ALL_FEATURES, FEATURE_INFO, planPrice } from "@sistema-flores/types";
import { Check } from "lucide-react";
import { useState } from "react";
import { useLandingData } from "@/lib/landing-data";
import { APP_URL, whatsappWith } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Cta } from "./cta";
import { SectionHeading } from "./section-heading";

function price(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function Plans() {
  const [users, setUsers] = useState(2);
  // Preços vigentes vêm da API (o gestor pode mudá-los a qualquer momento);
  // a landing é estática, então a busca é no navegador, com fallback local.
  const { plans: offers } = useLandingData();

  const userPrice = offers[0]?.userPrice ?? 16;
  const usersLabel = users === 1 ? "1 pessoa" : `${users} pessoas`;

  return (
    <section
      id="planos"
      className="section-y"
      style={{ background: "hsl(var(--secondary) / .5)" }}
    >
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Planos simples, sem surpresa"
          title="Escolha o plano, pague pela equipe"
          subtitle={`A mensalidade já inclui 1 acesso; cada pessoa a mais custa ${price(userPrice)}/mês. Teste grátis por 7 dias, sem cartão.`}
        />

        {/* Quantas pessoas vão usar — atualiza o total dos 3 planos */}
        <div className="mx-auto mt-10 max-w-[560px] rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Quantas pessoas vão usar o sistema?
            </span>
            <span className="sf-serif text-2xl font-semibold tabular-nums">
              {usersLabel}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={users}
            onChange={(e) => setUsers(Number(e.target.value))}
            aria-label="Número de pessoas na equipe"
            className="sf-slider mt-4"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>10+</span>
          </div>
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            1 acesso já vem incluso; a partir da 2ª pessoa são {price(userPrice)}
            /mês cada. Sem limite de usuários — a equipe cresce e o sistema
            acompanha.
          </p>
        </div>

        {/* Os 3 planos, com preço total para a equipe escolhida */}
        <div className="mt-8 grid grid-cols-3 gap-5 max-[960px]:grid-cols-1">
          {offers.map((offer, index) => {
            const featured = index === 1;
            const total = planPrice(offer, users);
            return (
              <div
                key={offer.id}
                className={cn(
                  "sf-plan relative flex flex-col rounded-xl bg-card p-6",
                  featured
                    ? "border-2 border-primary shadow-lg"
                    : "border border-border shadow-card",
                )}
              >
                {featured ? (
                  <span className="absolute -top-3 left-6 rounded-sm bg-clay px-2.5 py-0.5 text-xs font-semibold text-clay-foreground">
                    Mais popular
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold">{offer.name}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {offer.tagline}
                </p>
                <p className="sf-serif mt-4 text-[34px] font-semibold tabular-nums">
                  {price(offer.basePrice)}
                  <span className="text-base font-medium text-muted-foreground">
                    {" "}
                    /mês
                  </span>
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  1 acesso incluso · + {price(offer.userPrice)} por pessoa a
                  mais · com {usersLabel}:{" "}
                  <span className="font-semibold text-foreground">
                    {price(total)}/mês
                  </span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {ALL_FEATURES.filter((f) => offer.features.includes(f)).map(
                    (f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-[15px]"
                      >
                        <Check
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            featured ? "text-primary" : "text-success",
                          )}
                          strokeWidth={2.5}
                        />
                        {FEATURE_INFO[f].label}
                      </li>
                    ),
                  )}
                </ul>
                <Cta
                  href={APP_URL}
                  variant={featured ? "clay" : "outline"}
                  className="mt-6 w-full !h-11"
                >
                  Testar grátis por 7 dias
                </Cta>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Clientes, catálogo e equipe estão inclusos em todos os planos. 7 dias
          grátis com tudo liberado, sem cartão e sem fidelidade.{" "}
          <a
            href={whatsappWith(
              "Olá! Quero ajuda para escolher um plano do Floreei.",
            )}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Precisa de ajuda para escolher? Fale com a gente.
          </a>
        </p>
      </div>
    </section>
  );
}
