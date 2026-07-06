"use client";

import { useCountUp } from "@/lib/use-count-up";

const inteiro = (v: number) => Math.round(v).toLocaleString("pt-BR");

export function HeroPanel() {
  const receber = useCountUp(8240);
  const eventos = useCountUp(12);
  const vendas = useCountUp(21.9);

  const rows = [
    { title: "Casamento — Ana & Rui", status: "Aprovado", tone: "success" },
    { title: "Buquê corporativo · 40un", status: "Pendente", tone: "warning" },
    { title: "Decoração 15 anos", status: "Rascunho", tone: "muted" },
  ] as const;

  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
      aria-hidden="true"
    >
      {/* Chrome */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-clay" />
          <span className="h-3 w-3 rounded-full bg-warning" />
          <span className="h-3 w-3 rounded-full bg-success" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Painel · Hoje
        </span>
      </div>

      <div className="space-y-5 p-5">
        {/* Tiles */}
        <div className="grid grid-cols-3 gap-3">
          <Tile label="A receber" value={`R$ ${inteiro(receber)}`} />
          <Tile label="Eventos" value={inteiro(eventos)} />
          <Tile
            label="Vendas mês"
            value={`R$ ${vendas.toFixed(1).replace(".", ",")}k`}
            highlight
          />
        </div>

        {/* Lista */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Orçamentos recentes</span>
            <span className="text-xs font-medium text-primary">Ver todos</span>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border">
            {rows.map((r) => (
              <div
                key={r.title}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <span className="truncate text-sm">{r.title}</span>
                <StatusPill tone={r.tone}>{r.status}</StatusPill>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "sf-pulse rounded-lg bg-primary px-3.5 py-3 text-primary-foreground"
          : "rounded-lg bg-secondary px-3.5 py-3"
      }
    >
      <p
        className={
          highlight
            ? "text-xs text-primary-foreground/80"
            : "text-xs text-muted-foreground"
        }
      >
        {label}
      </p>
      <p className="sf-serif mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "muted";
  children: React.ReactNode;
}) {
  const cls = {
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    muted: "bg-secondary text-muted-foreground",
  }[tone];
  return (
    <span
      className={`shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
