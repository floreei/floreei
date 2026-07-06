"use client";

import type { CompanyDetail } from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  TrendingDown,
  TrendingUp,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["company", id],
    queryFn: () => api.get<CompanyDetail>(`/admin/companies/${id}`),
  });

  const mutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) =>
      api.post<CompanyDetail>(`/admin/companies/${id}/${path}`, body),
    onSuccess: (updated) => {
      qc.setQueryData(["company", id], updated);
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
  });

  const run = (path: string, msg: string, body?: unknown) =>
    mutation.mutate(
      { path, body },
      {
        onSuccess: () => toast.success(msg),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Não foi possível."),
      },
    );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">Empresa não encontrada.</p>
    );
  }

  const isSuspended = data.status === "SUSPENDED";
  const isActivePlan = data.plan === "ACTIVE";
  const busy = mutation.isPending;
  const m = data.metrics;
  const trend = m.salesLast7 - m.salesPrev7;

  return (
    <div className="space-y-6">
      <Link
        href="/empresas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Empresas
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-semibold">{data.name}</h1>
            <StatusBadge status={data.status} trialDaysLeft={data.trialDaysLeft} />
          </div>
          <p className="text-sm text-muted-foreground">
            {data.document ? `${data.document} · ` : ""}
            Cliente desde {formatDate(data.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Acesso + ações */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2 text-sm">
              <Row label="Plano" value={isActivePlan ? "Liberado" : "Gratuito"} />
              <Row
                label="Fim do período"
                value={isActivePlan ? "sem prazo" : formatDate(data.trialEndsAt)}
              />
              <Row label="Primeiro acesso" value={formatDate(data.firstAccessAt)} />
              <Row label="Último acesso" value={formatDate(data.lastSeenAt)} />
            </dl>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                Estender período gratuito
              </p>
              <div className="flex gap-2">
                {[7, 15, 30].map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={busy}
                    onClick={() =>
                      run("extend-trial", `Período estendido em ${d} dias.`, {
                        days: d,
                      })
                    }
                  >
                    +{d}d
                  </Button>
                ))}
              </div>

              {!isActivePlan ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={busy}
                  onClick={() => run("activate", "Empresa liberada sem prazo.")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Liberar sem prazo
                </Button>
              ) : null}

              {isSuspended ? (
                <Button
                  size="sm"
                  className="w-full"
                  disabled={busy}
                  onClick={() => run("reactivate", "Acesso reativado.")}
                >
                  <Unlock className="h-4 w-4" />
                  Reativar acesso
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={busy}
                  onClick={() => run("suspend", "Acesso suspenso.")}
                >
                  <Lock className="h-4 w-4" />
                  Suspender acesso
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Métricas */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Uso e volume</CardTitle>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {trend >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                {m.salesLast7} vendas nos últimos 7 dias
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Metric label="Receita total" value={formatCurrency(m.revenue)} />
                <Metric label="Vendas" value={formatNumber(m.sales)} />
                <Metric label="Orçamentos" value={formatNumber(m.quotes)} />
                <Metric label="Clientes" value={formatNumber(m.customers)} />
                <Metric label="Produtos" value={formatNumber(m.products)} />
                <Metric label="Buquês" value={formatNumber(m.arrangements)} />
                <Metric label="Compras" value={formatNumber(m.purchases)} />
                <Metric
                  label="Total comprado"
                  value={formatCurrency(m.purchasesTotal)}
                />
                <Metric label="Despesas" value={formatNumber(m.expenses)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Equipe ({data.team.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.team.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {u.role === "ADMIN" ? "Administrador" : "Operador"}
                    {u.active ? "" : " · inativo"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
