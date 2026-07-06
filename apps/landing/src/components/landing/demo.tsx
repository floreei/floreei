"use client";

import { BarChart3, Check, FileText, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { brl, cn } from "@/lib/utils";
import { prefersReduced, useCountUp } from "@/lib/use-count-up";
import { SectionHeading } from "./section-heading";

const TABS = [
  { label: "Orçamento", icon: FileText },
  { label: "Venda", icon: ShoppingCart },
  { label: "Financeiro", icon: BarChart3 },
];
const DURATION = 4500;

const panelStyle = {
  animation: "sfIn .45s var(--ease-standard) both",
} as const;

export function Demo() {
  const [tab, setTab] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const accRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => setReduced(prefersReduced()), []);

  useEffect(() => {
    if (reduced) {
      setProgress(100);
      return;
    }
    lastRef.current = performance.now();
    let raf: number;
    const loop = (now: number) => {
      const dt = now - lastRef.current;
      lastRef.current = now;
      if (!document.hidden) {
        accRef.current += dt;
        setProgress(Math.min(100, (accRef.current / DURATION) * 100));
        if (accRef.current >= DURATION) {
          accRef.current = 0;
          setTab((t) => (t + 1) % TABS.length);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const selectTab = (i: number) => {
    accRef.current = 0;
    setProgress(0);
    setTab(i);
  };

  return (
    <section className="section-y">
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Veja funcionando"
          title="O sistema trabalhando por você"
          subtitle="Do orçamento aprovado à venda registrada e ao caixa atualizado — o mesmo fluxo do dia a dia, rodando na sua frente."
        />

        <div className="mx-auto mt-10 max-w-[880px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {/* Chrome */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-clay" />
              <span className="h-3 w-3 rounded-full bg-warning" />
              <span className="h-3 w-3 rounded-full bg-success" />
            </div>
            <span className="text-sm text-muted-foreground">
              app.floreei.com.br
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {TABS.map((t, i) => {
              const active = tab === i;
              return (
                <button
                  key={t.label}
                  onClick={() => selectTab(i)}
                  className={cn(
                    "relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                  {active ? (
                    <span
                      className="absolute bottom-0 left-0 h-0.5 bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div className="p-6 max-[560px]:p-4" style={{ minHeight: 280 }}>
            <div key={tab} style={panelStyle}>
              {tab === 0 ? <OrcamentoPanel /> : null}
              {tab === 1 ? <VendaPanel /> : null}
              {tab === 2 ? <FinanceiroPanel /> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const orcItems = [
  { name: "Buquê de rosas colombianas", qtd: "2 un", val: "R$ 360,00" },
  { name: "Arranjo de mesa — hortênsias", qtd: "4 un", val: "R$ 520,00" },
  { name: "Coroa de flores", qtd: "1 un", val: "R$ 600,00" },
];

function OrcamentoPanel() {
  const total = useCountUp(1480, 1000);
  return (
    <div className="grid grid-cols-[1.4fr_1fr] gap-4 max-[560px]:grid-cols-1">
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            Orçamento · Casamento Ana &amp; Rui
          </span>
          <span className="text-xs text-muted-foreground">#0428</span>
        </div>
        <ul className="mt-3 divide-y divide-border">
          {orcItems.map((it) => (
            <li key={it.name} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm">{it.name}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                <span className="mr-3">{it.qtd}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {it.val}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="flex flex-col justify-between rounded-lg p-4"
        style={{
          background: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
        }}
      >
        <div>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / .82)" }}>
            Total do orçamento
          </p>
          <p className="sf-serif mt-1 text-[30px] font-semibold tabular-nums">
            {brl(total)}
          </p>
        </div>
        <span
          className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium"
          style={{ background: "hsl(0 0% 100% / .16)" }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          Aprovado pelo cliente
        </span>
      </div>
    </div>
  );
}

function VendaPanel() {
  const valor = useCountUp(340, 1000);
  return (
    <div className="mx-auto max-w-md">
      <p className="text-sm font-semibold">Registrar venda · Balcão</p>
      <div className="mt-3 rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Valor da venda</p>
        <p className="sf-serif text-[30px] font-semibold tabular-nums">
          {brl(valor)}
        </p>
        <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium">Balcão</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Itens</span>
            <span className="font-medium">Buquê de rosas · 2un</span>
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-success">
        <Check className="h-4 w-4" strokeWidth={2.5} />
        Venda registrada e estoque atualizado.
      </p>
    </div>
  );
}

const barData = [40, 68, 52, 88, 62];
const barDays = ["Seg", "Ter", "Qua", "Qui", "Sex"];

function FinanceiroPanel() {
  const grow = useCountUp(1, 900);
  const saldo = useCountUp(12750, 1000);
  return (
    <div className="grid grid-cols-[1.3fr_1fr] gap-4 max-[560px]:grid-cols-1">
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-semibold">Entradas da semana</p>
        <div className="mt-4 flex h-32 items-end gap-2">
          {barData.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-primary"
                  style={{ height: `${h * grow}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {barDays[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Saldo em caixa</p>
          <p className="sf-serif text-2xl font-semibold tabular-nums">
            {brl(saldo)}
          </p>
        </div>
        <div className="rounded-lg bg-success/10 p-3">
          <p className="text-xs text-muted-foreground">A receber</p>
          <p className="font-semibold text-success tabular-nums">R$ 3.180,00</p>
        </div>
        <div className="rounded-lg bg-destructive/10 p-3">
          <p className="text-xs text-muted-foreground">A pagar</p>
          <p className="font-semibold text-destructive tabular-nums">
            R$ 1.240,00
          </p>
        </div>
      </div>
    </div>
  );
}
