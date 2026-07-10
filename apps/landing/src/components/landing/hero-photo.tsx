"use client";

import { Check } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { MiniStat, PhotoBadge } from "./photo-badge";
import { Reveal } from "./reveal";

const inteiro = (v: number) => Math.round(v).toLocaleString("pt-BR");

/** Foto real + selos flutuantes com os mesmos números do painel — mais humano que um mockup de UI. */
export function HeroPhoto() {
  const receber = useCountUp(8240);
  const vendas = useCountUp(21.9);

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/landing/hero-people.webp"
        alt="Florista usando o Floreei"
        className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg"
        loading="eager"
      />

      <Reveal
        variant="pop"
        delay={260}
        className="absolute -left-4 top-8 sm:-left-6"
      >
        <MiniStat
          label="Vendas do mês"
          value={`R$ ${vendas.toFixed(1).replace(".", ",")}k`}
        />
      </Reveal>

      <Reveal
        variant="pop"
        delay={420}
        className="absolute -left-4 top-1/2 -translate-y-1/2 sm:-left-6"
      >
        <PhotoBadge
          icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
          title="Orçamento aprovado"
          subtitle="Casamento — Ana & Rui"
        />
      </Reveal>

      <Reveal
        variant="pop"
        delay={580}
        className="absolute -bottom-4 -right-4 sm:-right-6"
      >
        <MiniStat label="A receber" value={`R$ ${inteiro(receber)}`} />
      </Reveal>
    </div>
  );
}
