"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { plans } from "@/data/landing";
import { WHATSAPP_LINK } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Cta } from "./cta";
import { SectionHeading } from "./section-heading";

export function Plans() {
  const [seats, setSeats] = useState(3);
  const total = 89 + (seats - 1) * 39;
  const seatsLabel = seats === 1 ? "acesso" : "acessos";
  const hint =
    seats === 1
      ? "Só você, com todos os recursos do plano."
      : "R$ 89 pelo 1º acesso + R$ 39 por acesso adicional.";

  return (
    <section
      id="planos"
      className="section-y"
      style={{ background: "hsl(var(--secondary) / .5)" }}
    >
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Planos por número de acessos"
          title="Pague pelo tamanho da sua equipe"
          subtitle="O preço acompanha a quantidade de pessoas com acesso ao sistema. Comece pequeno e cresça no seu ritmo."
        />

        {/* Calculadora */}
        <div className="mx-auto mt-10 max-w-[560px] rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Quantos acessos você precisa?
            </span>
            <span className="sf-serif text-2xl font-semibold tabular-nums">
              {seats} {seatsLabel}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            aria-label="Número de acessos"
            className="sf-slider mt-4"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>20+</span>
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">A partir de</p>
            <p className="sf-serif text-[32px] font-semibold tabular-nums">
              R$ {total}
              <span className="text-lg font-medium text-muted-foreground">
                {" "}
                /mês
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
          </div>
        </div>

        {/* Faixas de plano */}
        <div className="mt-8 grid grid-cols-3 gap-5 max-[960px]:grid-cols-1">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                "sf-plan relative flex flex-col rounded-xl bg-card p-6",
                p.featured
                  ? "border-2 border-primary shadow-lg"
                  : "border border-border shadow-card",
              )}
            >
              {p.featured ? (
                <span className="absolute -top-3 left-6 rounded-sm bg-clay px-2.5 py-0.5 text-xs font-semibold text-clay-foreground">
                  Mais popular
                </span>
              ) : null}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.seats}</p>
              <p className="sf-serif mt-4 text-[34px] font-semibold tabular-nums">
                R$ {p.priceFrom}
                <span className="text-base font-medium text-muted-foreground">
                  {" "}
                  /mês
                </span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2.5 text-[15px]">
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        p.featured ? "text-primary" : "text-success",
                      )}
                      strokeWidth={2.5}
                    />
                    {it}
                  </li>
                ))}
              </ul>
              <Cta
                href={WHATSAPP_LINK}
                variant={p.clay ? "clay" : "outline"}
                className="mt-6 w-full !h-11"
              >
                {p.cta}
              </Cta>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Todos os planos incluem 7 dias grátis, suporte em português e
          atualizações sem custo. Sem fidelidade.
        </p>
      </div>
    </section>
  );
}
