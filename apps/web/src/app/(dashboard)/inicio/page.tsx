"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  HandCoins,
  Scale,
  ShoppingBasket,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FirstSteps } from "@/components/dashboard/first-steps";
import { InstallPromptCard } from "@/components/pwa/install-prompt";
import { useQuickSale } from "@/components/events/quick-sale-provider";
import {
  CashflowChart,
  type CashflowPoint,
} from "@/components/finance/cashflow-chart";
import { PurchaseDialog } from "@/components/purchases/purchase-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCashflow, useFinanceSummary } from "@/lib/api/finance";
import { useAuth } from "@/lib/auth/auth-context";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
function localISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MONTHS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type Period = "day" | "week" | "month" | "year" | "custom";

const periodOptions: Array<[Period, string]> = [
  ["day", "Hoje"],
  ["week", "7 dias"],
  ["month", "Este mês"],
  ["year", "Este ano"],
  ["custom", "Período"],
];

const periodLabel: Record<Period, string> = {
  day: "hoje",
  week: "nos últimos 7 dias",
  month: "neste mês",
  year: "neste ano",
  custom: "no período",
};

/** Agrupa os movimentos do caixa por dia ou por mês, conforme o tamanho do período. */
function buildSeries(
  movements: CashMovementLike[],
  from: string,
  to: string,
): { points: CashflowPoint[]; unit: "dia" | "mês" } {
  const spanDays = Math.round(
    (Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86_400_000,
  );
  const byDay = spanDays <= 62;
  const round = (v: number) => Number(v.toFixed(2));

  const buckets = new Map<string, { entradas: number; saidas: number }>();

  if (byDay) {
    const cur = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    while (cur <= end) {
      buckets.set(localISO(cur), { entradas: 0, saidas: 0 });
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    const cur = new Date(`${from}T00:00:00`);
    cur.setDate(1);
    const end = new Date(`${to}T00:00:00`);
    end.setDate(1);
    while (cur <= end) {
      buckets.set(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`, {
        entradas: 0,
        saidas: 0,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  for (const m of movements) {
    const key = byDay ? m.date.slice(0, 10) : m.date.slice(0, 7);
    const b = buckets.get(key);
    if (!b) continue;
    if (m.direction === "IN") b.entradas += m.amount;
    else b.saidas += m.amount;
  }

  const points: CashflowPoint[] = [...buckets.entries()].map(([key, b]) => {
    const entradas = round(b.entradas);
    const saidas = round(b.saidas);
    const monthIdx = Number(key.slice(5, 7)) - 1;
    return {
      label: byDay ? `${key.slice(8, 10)}/${key.slice(5, 7)}` : MONTHS[monthIdx],
      fullLabel: byDay
        ? formatDate(key)
        : `${MONTHS_FULL[monthIdx]} ${key.slice(0, 4)}`,
      entradas,
      saidas,
      saldo: round(entradas - saidas),
    };
  });

  return { points, unit: byDay ? "dia" : "mês" };
}

interface CashMovementLike {
  date: string;
  direction: "IN" | "OUT";
  amount: number;
}

export default function InicioPage() {
  const { user } = useAuth();
  const { openSaleChooser } = useQuickSale();
  const hasWholesale = (user?.access?.features ?? []).includes("WHOLESALE");
  const { data: finance, isLoading: loadingFin } = useFinanceSummary();

  const [period, setPeriod] = useState<Period>("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [buyOpen, setBuyOpen] = useState(false);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const today = localISO(now);
    switch (period) {
      case "day":
        return { from: today, to: today };
      case "week": {
        const s = new Date(now);
        s.setDate(now.getDate() - 6);
        return { from: localISO(s), to: today };
      }
      case "month":
        return {
          from: localISO(new Date(now.getFullYear(), now.getMonth(), 1)),
          to: localISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
        };
      case "year":
        return {
          from: localISO(new Date(now.getFullYear(), 0, 1)),
          to: localISO(new Date(now.getFullYear(), 11, 31)),
        };
      case "custom":
        return { from: custom.from || today, to: custom.to || today };
    }
  }, [period, custom]);

  const { data: cash, isLoading: loadingCash } = useCashflow(from, to);

  const series = useMemo(
    () => buildSeries((cash?.movements ?? []) as CashMovementLike[], from, to),
    [cash, from, to],
  );

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={firstName ? `Olá, ${firstName}` : "Início"}
        description="O que você quer fazer agora?"
      />

      <FirstSteps />

      <InstallPromptCard />

      {/* Ações grandes do dia a dia */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ActionButton
          icon={ShoppingCart}
          label="Nova venda"
          hint={hasWholesale ? "Direta ou atacado" : "Venda direta / entrega"}
          onClick={openSaleChooser}
          primary
        />
        <ActionButton
          icon={ShoppingBasket}
          label="Nova compra"
          hint="Pagar fornecedor"
          onClick={() => setBuyOpen(true)}
        />
        <ActionLink icon={Coins} label="Caixa" hint="Entrou / saiu" href="/caixa" />
        <ActionLink
          icon={HandCoins}
          label="A receber / a pagar"
          hint="Quem deve"
          href="/financeiro"
        />
      </div>

      {/* A receber / a pagar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BigMoneyCard
          href="/financeiro"
          icon={ArrowDownCircle}
          label="A receber"
          value={loadingFin ? null : formatCurrency(finance?.totalReceivable ?? 0)}
          tone="in"
        />
        <BigMoneyCard
          href="/financeiro"
          icon={ArrowUpCircle}
          label="A pagar"
          value={loadingFin ? null : formatCurrency(finance?.totalPayable ?? 0)}
          tone="out"
        />
      </div>

      {/* Um único filtro controla o resumo E o gráfico abaixo */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold">Movimento do caixa</h2>
            <p className="text-sm text-muted-foreground">
              Resumo e gráfico {periodLabel[period]}.
            </p>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0">
            {periodOptions.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors sm:px-3 sm:py-1.5",
                  period === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              De
              <Input
                type="date"
                className="h-9"
                value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Até
              <Input
                type="date"
                className="h-9"
                value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              />
            </label>
          </div>
        ) : null}

        {/* Resumo do período */}
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <MiniStat
              icon={ArrowDownCircle}
              label="Entrou"
              value={loadingCash ? null : formatCurrency(cash?.entradas ?? 0)}
              tone="in"
            />
            <MiniStat
              icon={ArrowUpCircle}
              label="Saiu"
              value={loadingCash ? null : formatCurrency(cash?.saidas ?? 0)}
              tone="out"
            />
            <MiniStat
              icon={Scale}
              label="Saldo"
              value={loadingCash ? null : formatCurrency(cash?.saldo ?? 0)}
              tone={cash && cash.saldo < 0 ? "out" : "in"}
            />
          </CardContent>
        </Card>

        {/* Gráfico do mesmo período */}
        <Card>
          <CardHeader>
            <CardTitle>Entradas e saídas por {series.unit}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Compare {series.unit === "dia" ? "os dias" : "os meses"} e veja o
              melhor e o pior do período.
            </p>
          </CardHeader>
          <CardContent>
            {loadingCash ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <CashflowChart points={series.points} unit={series.unit} />
            )}
          </CardContent>
        </Card>
      </section>

      <PurchaseDialog open={buyOpen} onOpenChange={setBuyOpen} />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  hint,
  onClick,
  primary,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] sm:gap-3 sm:p-5",
        primary
          ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "border-border bg-card hover:border-primary hover:bg-primary/5",
      )}
    >
      <Icon className="h-7 w-7" />
      <div>
        <p className="text-base font-semibold">{label}</p>
        <p className={cn("text-sm", primary ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {hint}
        </p>
      </div>
    </button>
  );
}

function ActionLink({
  icon: Icon,
  label,
  hint,
  href,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] sm:gap-3 sm:p-5"
    >
      <Icon className="h-7 w-7 text-primary" />
      <div>
        <p className="text-base font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
    </Link>
  );
}

function BigMoneyCard({
  href,
  icon: Icon,
  label,
  value,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string | null;
  tone: "in" | "out";
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center gap-4 p-6">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              tone === "in" ? "bg-success/12 text-success" : "bg-clay/12 text-clay",
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {value === null ? (
              <Skeleton className="mt-1 h-8 w-32" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight">{value}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  tone: "in" | "out";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          tone === "in" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {value === null ? (
          <Skeleton className="mt-1 h-6 w-24" />
        ) : (
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}
