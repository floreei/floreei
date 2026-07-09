"use client";

import type { CashMovement } from "@sistema-flores/types";
import { ArrowDownCircle, ArrowUpCircle, ChevronRight, Scale } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";
import { CashInDialog } from "@/components/finance/cash-in-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCashflow } from "@/lib/api/finance";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
function localISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const kindLabels: Record<CashMovement["kind"], string> = {
  receivement: "Recebimento",
  supplier_payment: "Pagamento",
  expense: "Despesa",
  manual: "Avulso",
};

export default function CaixaPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "custom">(
    "day",
  );
  const [customFrom, setCustomFrom] = useState(() => localISO(new Date()));
  const [customTo, setCustomTo] = useState(() => localISO(new Date()));
  const [inOpen, setInOpen] = useState(false);
  const [outOpen, setOutOpen] = useState(false);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const today = localISO(now);
    if (period === "custom") {
      // Swap de segurança caso o usuário inverta o intervalo.
      return customFrom <= customTo
        ? { from: customFrom, to: customTo }
        : { from: customTo, to: customFrom };
    }
    if (period === "day") return { from: today, to: today };
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: localISO(start), to: today };
    }
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { from: localISO(start), to: today };
  }, [period, customFrom, customTo]);

  const { data, isLoading } = useCashflow(from, to);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caixa"
        description="O que entrou e saiu, com o saldo do período."
      >
        <Button variant="outline" onClick={() => setOutOpen(true)}>
          <ArrowUpCircle className="h-4 w-4" />
          Saída
        </Button>
        <Button onClick={() => setInOpen(true)}>
          <ArrowDownCircle className="h-4 w-4" />
          Entrada
        </Button>
      </PageHeader>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["day", "Hoje"],
              ["week", "Últimos 7 dias"],
              ["month", "Este mês"],
              ["custom", "Personalizado"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                period === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {period === "custom" ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="caixa-from" className="text-xs">
                De
              </Label>
              <Input
                id="caixa-from"
                type="date"
                className="h-9"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="caixa-to" className="text-xs">
                Até
              </Label>
              <Input
                id="caixa-to"
                type="date"
                className="h-9"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          icon={ArrowDownCircle}
          label="Entrou"
          value={isLoading ? null : formatCurrency(data?.entradas ?? 0)}
          tone="in"
        />
        <Kpi
          icon={ArrowUpCircle}
          label="Saiu"
          value={isLoading ? null : formatCurrency(data?.saidas ?? 0)}
          tone="out"
        />
        <Kpi
          icon={Scale}
          label="Saldo do período"
          value={isLoading ? null : formatCurrency(data?.saldo ?? 0)}
          tone={data && data.saldo < 0 ? "out" : "in"}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.movements.length > 0 ? (
            <div className="divide-y divide-border">
              {data.movements.map((m) => {
                const href =
                  m.sourceType === "event"
                    ? `/vendas/${m.sourceId}`
                    : m.sourceType === "purchase"
                      ? `/compras/${m.sourceId}`
                      : null;
                const inner = (
                  <>
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        m.direction === "IN"
                          ? "bg-success/12 text-success"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {m.direction === "IN" ? (
                        <ArrowDownCircle className="h-5 w-5" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(m.date)} · {kindLabels[m.kind]}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        m.direction === "IN" ? "text-success" : "text-destructive",
                      )}
                    >
                      {m.direction === "IN" ? "+" : "−"} {formatCurrency(m.amount)}
                    </span>
                    {href ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : null}
                  </>
                );
                return href ? (
                  <Link
                    key={`${m.kind}-${m.id}`}
                    href={href}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={`${m.kind}-${m.id}`} className="flex items-center gap-3 px-4 py-3">
                    {inner}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              className="border-0"
              icon={<Scale />}
              title="Sem movimentações no período"
              description="Vendas recebidas, pagamentos e despesas aparecem aqui."
            />
          )}
        </CardContent>
      </Card>

      <CashInDialog open={inOpen} onOpenChange={setInOpen} />
      <ExpenseDialog open={outOpen} onOpenChange={setOutOpen} />
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Scale;
  label: string;
  value: string | null;
  tone: "in" | "out";
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            tone === "in" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {value === null ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
