"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarHeart,
  ChevronRight,
  FileText,
  Package,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  EventStatusBadge,
  QuoteStatusBadge,
} from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/lib/api/dashboard";
import { useFinanceSummary } from "@/lib/api/finance";
import { useStockOverview } from "@/lib/api/stock";
import { formatCurrency, formatDate } from "@/lib/utils";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: finance, isLoading: loadingFinance } = useFinanceSummary();
  const { data: stock } = useStockOverview();

  const today = todayStr();
  const overdueReceivable = (finance?.receivables ?? []).filter((r) => r.date < today);
  const overduePayable = (finance?.payables ?? []).filter((p) => p.date < today);
  const lowStock = stock?.lowCount ?? 0;
  const hasAlerts =
    lowStock > 0 || overdueReceivable.length > 0 || overduePayable.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão geral"
        description="O pulso da sua floricultura — eventos, receita e pendências do mês."
      />

      {hasAlerts ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lowStock > 0 ? (
            <AlertItem
              href="/estoque"
              icon={<Package className="h-4 w-4" />}
              tone="warning"
              text={`${lowStock} ${lowStock === 1 ? "produto" : "produtos"} em estoque baixo`}
            />
          ) : null}
          {overdueReceivable.length > 0 ? (
            <AlertItem
              href="/financeiro"
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="clay"
              text={`${overdueReceivable.length} ${overdueReceivable.length === 1 ? "conta vencida" : "contas vencidas"} a receber`}
            />
          ) : null}
          {overduePayable.length > 0 ? (
            <AlertItem
              href="/financeiro"
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="destructive"
              text={`${overduePayable.length} ${overduePayable.length === 1 ? "conta vencida" : "contas vencidas"} a pagar`}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          icon={CalendarHeart}
          label="Vendas no mês"
          value={isLoading ? null : String(data?.eventsThisMonth ?? 0)}
        />
        <StatCard
          icon={TrendingUp}
          label="Receita do mês"
          value={isLoading ? null : formatCurrency(data?.revenueThisMonth ?? 0)}
        />
        <StatCard
          icon={PiggyBank}
          label="Lucro estimado"
          value={
            isLoading ? null : formatCurrency(data?.estimatedProfitThisMonth ?? 0)
          }
          accent
        />
        <StatCard
          icon={Wallet}
          label="A receber"
          value={isLoading ? null : formatCurrency(data?.accountsReceivable ?? 0)}
        />
        <StatCard
          icon={FileText}
          label="Orçamentos pendentes"
          value={isLoading ? null : String(data?.pendingQuotes ?? 0)}
        />
        <StatCard
          icon={ArrowDownLeft}
          label="A receber"
          value={loadingFinance ? null : formatCurrency(finance?.totalReceivable ?? 0)}
        />
        <StatCard
          icon={ArrowUpRight}
          label="A pagar"
          value={loadingFinance ? null : formatCurrency(finance?.totalPayable ?? 0)}
          accent
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita e lucro</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <RevenueChart data={data.revenueSeries} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Próximos eventos</CardTitle>
              <CardDescription>Agenda confirmada</CardDescription>
            </div>
            <Link
              href="/eventos"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : data && data.upcomingEvents.length > 0 ? (
              data.upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.date)} · {event.customer?.name ?? "Consumidor"}
                    </p>
                  </div>
                  <EventStatusBadge status={event.status} />
                </Link>
              ))
            ) : (
              <EmptyState
                title="Nenhum evento à vista"
                description="Converta um orçamento aprovado em evento."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Orçamentos recentes</CardTitle>
            <CardDescription>Os últimos criados</CardDescription>
          </div>
          <Link
            href="/orcamentos"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : data && data.recentQuotes.length > 0 ? (
            data.recentQuotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/orcamentos/${quote.id}`}
                className="flex items-center justify-between rounded-lg border border-border/70 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{quote.number}
                  </span>
                  <span className="text-sm font-medium">
                    {quote.customer?.name ?? "Cliente"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {formatCurrency(quote.totalSale)}
                  </span>
                  <QuoteStatusBadge status={quote.status} />
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Nenhum orçamento ainda"
              description="Crie o primeiro orçamento para começar."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AlertItem({
  href,
  icon,
  text,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
  tone: "warning" | "clay" | "destructive";
}) {
  const tones = {
    warning: "border-warning/30 bg-warning/10 text-warning",
    clay: "border-clay/30 bg-clay/10 text-clay",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  } as const;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors hover:brightness-95 ${tones[tone]}`}
    >
      {icon}
      <span className="flex-1 text-foreground">{text}</span>
      <ChevronRight className="h-4 w-4 opacity-60" />
    </Link>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent ? "bg-clay/12 text-clay" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {value === null ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
