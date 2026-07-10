"use client";

import { useState } from "react";
import { custoRaw } from "@/data/landing";
import { brl } from "@/lib/utils";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const CUSTO_TOTAL = custoRaw.reduce((sum, c) => sum + c.val, 0); // 83,50

export function PriceCalculator() {
  const [mode, setMode] = useState<"pct" | "val">("pct");
  const [margemPct, setMargemPct] = useState(60);
  const [margemVal, setMargemVal] = useState(60);

  const lucro = mode === "pct" ? (CUSTO_TOTAL * margemPct) / 100 : margemVal;
  const preco = CUSTO_TOTAL + lucro;
  const lucroPctVenda = preco > 0 ? Math.round((lucro / preco) * 100) : 0;

  return (
    <section
      className="section-y"
      style={{ background: "hsl(var(--secondary) / .5)" }}
    >
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Formação de preço"
          title="Saiba o custo exato. Defina o lucro que você quer."
          subtitle="O Floreei soma cada item de um arranjo e mostra quanto ele realmente custou. Você escolhe a margem — em percentual ou valor fixo — e o preço de venda sai na hora. Nunca mais venda no chute."
        />

        <Reveal className="mx-auto mt-10 grid max-w-[940px] grid-cols-2 overflow-hidden rounded-xl border border-border shadow-lg max-[900px]:grid-cols-1">
          {/* Composição do custo */}
          <div className="bg-card p-7 max-[900px]:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Composição do custo</h3>
              <span className="text-sm text-muted-foreground">Buquê de rosas</span>
            </div>
            <ul className="mt-5 divide-y divide-border">
              {custoRaw.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between gap-3 py-3 text-[15px]"
                >
                  <span>{c.name}</span>
                  <span className="tabular-nums font-medium">{brl(c.val)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Custo total</span>
              <span className="sf-serif text-[28px] font-semibold tabular-nums">
                {brl(CUSTO_TOTAL)}
              </span>
            </div>
          </div>

          {/* Painel de lucro (verde) */}
          <div
            className="p-7 max-[900px]:p-6"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <h3 className="font-semibold">Quanto de lucro você quer?</h3>

            {/* Segmented */}
            <div
              className="mt-4 grid grid-cols-2 gap-1 rounded-md p-1"
              style={{ background: "hsl(0 0% 100% / .12)" }}
            >
              {(["pct", "val"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="h-9 rounded-[7px] text-sm font-medium transition-colors"
                  style={
                    mode === m
                      ? {
                          background: "hsl(0 0% 100%)",
                          color: "hsl(var(--foreground))",
                          boxShadow: "var(--shadow-xs)",
                        }
                      : { color: "hsl(0 0% 100% / .82)" }
                  }
                >
                  {m === "pct" ? "Percentual" : "Valor fixo"}
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "hsl(0 0% 100% / .82)" }}>Margem</span>
                <span className="font-semibold tabular-nums">
                  {mode === "pct" ? `${margemPct}%` : brl(margemVal)}
                </span>
              </div>
              {mode === "pct" ? (
                <input
                  type="range"
                  min={0}
                  max={200}
                  step={5}
                  value={margemPct}
                  onChange={(e) => setMargemPct(Number(e.target.value))}
                  aria-label="Margem em percentual"
                  className="sf-slider sf-slider-light mt-3"
                />
              ) : (
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={5}
                  value={margemVal}
                  onChange={(e) => setMargemVal(Number(e.target.value))}
                  aria-label="Lucro em reais"
                  className="sf-slider sf-slider-light mt-3"
                />
              )}
              <div
                className="mt-2 flex justify-between text-xs"
                style={{ color: "hsl(0 0% 100% / .6)" }}
              >
                <span>{mode === "pct" ? "0%" : "R$ 0"}</span>
                <span>{mode === "pct" ? "200%" : "R$ 300"}</span>
              </div>
            </div>

            <div
              className="mt-6 flex items-center justify-between border-t pt-4 text-sm"
              style={{ borderColor: "hsl(0 0% 100% / .15)" }}
            >
              <span style={{ color: "hsl(0 0% 100% / .82)" }}>
                Lucro por unidade
              </span>
              <span className="font-semibold tabular-nums">{brl(lucro)}</span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "hsl(0 0% 100% / .82)" }}>
                  Preço de venda
                </span>
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / .6)" }}>
                  Lucro é {lucroPctVenda}% do preço
                </span>
              </div>
              <p className="sf-serif mt-1 text-[34px] font-semibold tabular-nums">
                {brl(preco)}
              </p>
            </div>
          </div>
        </Reveal>

        <p className="mx-auto mt-5 max-w-[940px] text-center text-sm text-muted-foreground">
          Defina a margem uma vez por tipo de produto e o sistema já sugere o
          preço de venda em cada orçamento.
        </p>
      </div>
    </section>
  );
}
