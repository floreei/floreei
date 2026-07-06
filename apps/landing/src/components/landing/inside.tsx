import { AlertTriangle, Check, FileCheck } from "lucide-react";
import { insideRows } from "@/data/landing";
import { WHATSAPP_LINK } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Cta } from "./cta";
import { WhatsappIcon } from "./icons";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Inside() {
  return (
    <section id="detalhes" className="section-y">
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Funcionalidades em detalhe"
          title="Por dentro do Floreei"
          subtitle="Cada módulo foi pensado para o jeito que floricultura e decoração realmente trabalham. Veja o que você pode fazer em cada parte."
        />

        <div className="mt-24 space-y-16 max-[900px]:space-y-12">
          {insideRows.map((row, i) => {
            const mockLeft = i % 2 === 1;
            return (
              <Reveal key={row.title}>
                <div className="grid grid-cols-2 items-center gap-12 max-[960px]:grid-cols-1 max-[960px]:gap-8">
                  <div className={mockLeft ? "min-[960px]:order-2" : ""}>
                    <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.badge}
                    </span>
                    <h3 className="sf-serif t-h3 mt-4 font-semibold">
                      {row.title}
                    </h3>
                    <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                      {row.desc}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {row.bullets.map((b) => (
                        <li key={b} className="sf-chk">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-success"
                            strokeWidth={2.5}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={mockLeft ? "min-[960px]:order-1" : ""}>
                    <Mock index={i} />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
      {children}
    </div>
  );
}

function Mock({ index }: { index: number }) {
  if (index === 0) return <MockProposta />;
  if (index === 1) return <MockAgenda />;
  if (index === 2) return <MockEstoque />;
  if (index === 3) return <MockRanking />;
  return <MockPedido />;
}

function MockProposta() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Proposta · Buquê corporativo</span>
        <span className="rounded-sm bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
          Aguardando
        </span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        <li className="flex items-center justify-between py-2.5 text-sm">
          <span>Rosas colombianas · 24un</span>
          <span className="font-medium tabular-nums">R$ 432,00</span>
        </li>
        <li className="flex items-center justify-between py-2.5 text-sm">
          <span>Vaso de vidro · 4un</span>
          <span className="font-medium tabular-nums">R$ 180,00</span>
        </li>
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold tabular-nums">R$ 612,00</span>
      </div>
      <Cta href={WHATSAPP_LINK} variant="clay" className="mt-4 w-full !h-11">
        <WhatsappIcon className="h-[18px] w-[18px]" />
        Enviar por WhatsApp
      </Cta>
    </Card>
  );
}

const eventos = [
  {
    day: "14",
    wd: "SÁB",
    title: "Casamento Ana & Rui",
    sub: "Entrega 15h · Espaço Jardim",
    tone: "primary",
  },
  {
    day: "18",
    wd: "QUA",
    title: "Aniversário 15 anos",
    sub: "Montagem 9h · Buffet Villa",
    tone: "clay",
  },
  {
    day: "20",
    wd: "SEX",
    title: "Corporativo · Recepção",
    sub: "Entrega 8h · Torre Norte",
    tone: "muted",
  },
] as const;

function MockAgenda() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Junho</span>
        <span className="text-xs text-muted-foreground">
          3 eventos esta semana
        </span>
      </div>
      <div className="mt-3 space-y-2.5">
        {eventos.map((e) => (
          <div key={e.day} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md",
                e.tone === "primary" && "bg-primary text-primary-foreground",
                e.tone === "clay" && "bg-clay text-clay-foreground",
                e.tone === "muted" && "bg-secondary text-foreground",
              )}
            >
              <span className="text-sm font-semibold leading-none">{e.day}</span>
              <span className="mt-0.5 text-[10px] leading-none opacity-80">
                {e.wd}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{e.title}</p>
              <p className="truncate text-xs text-muted-foreground">{e.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const estoque = [
  { name: "Rosa vermelha", qty: "180 un", status: "Em estoque", warn: false },
  { name: "Hortênsia azul", qty: "12 un", status: "Acabando", warn: true },
  { name: "Vaso cerâmica P", qty: "34 un", status: "Em estoque", warn: false },
];

function MockEstoque() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Estoque</span>
        <span className="text-xs text-muted-foreground">Atualizado agora</span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {estoque.map((e) => (
          <li key={e.name} className="flex items-center justify-between py-2.5">
            <span className="text-sm">{e.name}</span>
            <span className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                {e.qty}
              </span>
              <span
                className={cn(
                  "rounded-sm px-2 py-0.5 text-xs font-medium",
                  e.warn
                    ? "bg-warning/15 text-warning"
                    : "bg-success/12 text-success",
                )}
              >
                {e.status}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        1 item precisa de reposição
      </div>
    </Card>
  );
}

const ranking = [
  { name: "Buquê de rosas", n: 128, clay: false },
  { name: "Arranjo de mesa", n: 86, clay: false },
  { name: "Cesta de flores", n: 54, clay: true },
  { name: "Coroa de flores", n: 31, clay: true },
];

function MockRanking() {
  const max = Math.max(...ranking.map((r) => r.n));
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Mais vendidos · Junho</span>
        <span className="text-xs text-muted-foreground">Top 4</span>
      </div>
      <div className="mt-4 space-y-3">
        {ranking.map((r) => (
          <div key={r.name}>
            <div className="flex items-center justify-between text-sm">
              <span>{r.name}</span>
              <span className="font-medium tabular-nums">{r.n}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-secondary">
              <div
                className={cn(
                  "h-2 rounded-full",
                  r.clay ? "bg-clay" : "bg-primary",
                )}
                style={{ width: `${(r.n / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MockPedido() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Pedido de venda · #1042</span>
        <span className="rounded-sm bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
          Emitido
        </span>
      </div>
      <ul className="mt-3 divide-y divide-border">
        <li className="flex items-center justify-between py-2.5 text-sm">
          <span>Buquê de rosas · 2un</span>
          <span className="font-medium tabular-nums">R$ 267,20</span>
        </li>
        <li className="flex items-center justify-between py-2.5 text-sm">
          <span>Arranjo de mesa · 1un</span>
          <span className="font-medium tabular-nums">R$ 190,00</span>
        </li>
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Total do pedido</span>
        <span className="font-semibold tabular-nums">R$ 457,20</span>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-md bg-success/10 px-3 py-2.5">
        <FileCheck className="h-5 w-5 shrink-0 text-success" />
        <div className="min-w-0 flex-1 text-xs">
          <p className="font-semibold text-foreground">NF-e nº 000.128.457</p>
          <p className="text-muted-foreground">Autorizada · 05/07 às 13:42</p>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </div>
    </Card>
  );
}
