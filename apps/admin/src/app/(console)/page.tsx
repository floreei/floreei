"use client";

import type { PlatformOverview } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  Clock,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function OverviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<PlatformOverview>("/admin/overview"),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar a visão geral.
      </p>
    );
  }

  const { totals } = data;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold">Visão geral</h1>
        <p className="text-muted-foreground">
          Como as empresas estão usando a plataforma.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Empresas"
          value={formatNumber(totals.companies)}
          hint={`${totals.active} ativas · ${totals.trial} em teste`}
          icon={Building2}
        />
        <StatCard
          label="Ativas nos últimos 7 dias"
          value={formatNumber(data.activeLast7)}
          hint="acessaram o sistema"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Em risco"
          value={formatNumber(data.atRisk)}
          hint="sem acessar há 7+ dias"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Receita processada"
          value={formatCurrency(data.totalRevenue)}
          hint={`${formatNumber(data.totalSales)} vendas no total`}
          icon={CircleDollarSign}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Por status de acesso
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusTile
            label="Período gratuito"
            value={totals.trial}
            href="/empresas?status=TRIAL"
          />
          <StatusTile
            label="Ativas"
            value={totals.active}
            href="/empresas?status=ACTIVE"
          />
          <StatusTile
            label="Expiradas"
            value={totals.expired}
            href="/empresas?status=EXPIRED"
            tone="warning"
          />
          <StatusTile
            label="Suspensas"
            value={totals.suspended}
            href="/empresas?status=SUSPENDED"
            tone="destructive"
          />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Novos cadastros (7 dias)"
          value={formatNumber(data.newLast7)}
          hint={`${formatNumber(data.newLast30)} nos últimos 30 dias`}
          icon={Sparkles}
        />
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Precisa de atenção</p>
              <p className="text-sm">
                {data.atRisk + totals.expired} empresas em risco ou expiradas.
              </p>
            </div>
            <Link
              href="/empresas?risk=true"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Clock className="h-4 w-4" />
              Ver empresas
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusTile({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const dot = {
    default: "bg-primary",
    warning: "bg-warning",
    destructive: "bg-destructive",
  }[tone];
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="flex items-center gap-3 p-5">
          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
          <div>
            <p className="text-2xl font-semibold tabular">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
