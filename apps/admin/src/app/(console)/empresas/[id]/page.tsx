"use client";

import type {
  CompanyDetail,
  Feature,
  PlanOffer,
  UpdateEntitlementsInput,
} from "@sistema-flores/types";
import { ALL_FEATURES, FEATURE_INFO } from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Lock,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAdminAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const router = useRouter();
  const { session } = useAdminAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["company", id],
    queryFn: () => api.get<CompanyDetail>(`/admin/companies/${id}`),
  });

  // Definições vigentes dos planos (nomes/features editáveis no console).
  const { data: planDefs } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.get<PlanOffer[]>("/admin/plans"),
    staleTime: 30_000,
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

  const entitlements = useMutation({
    mutationFn: (body: UpdateEntitlementsInput) =>
      api.put<CompanyDetail>(`/admin/companies/${id}/entitlements`, body),
    onSuccess: (updated) => {
      qc.setQueryData(["company", id], updated);
      qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Acesso atualizado.");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível."),
  });

  const remove = useMutation({
    mutationFn: () =>
      api.delete<{ ok: boolean; firebaseCleared: boolean }>(
        `/admin/companies/${id}`,
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      toast.success(
        res.firebaseCleared
          ? "Empresa excluída (Firebase + banco)."
          : "Empresa excluída do banco. Firebase Admin não configurado — logins não foram removidos.",
      );
      router.push("/empresas");
    },
    onError: (e) =>
      toast.error(
        e instanceof Error ? e.message : "Não foi possível excluir.",
      ),
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
        {/* Acesso + plano */}
        <div className="space-y-6 lg:col-span-1">
        <Card>
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
              <TrialExtender
                currentEnd={data.trialEndsAt}
                busy={busy}
                onSet={(date) =>
                  run("set-trial-end", "Período gratuito atualizado.", { date })
                }
              />

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

        {/* Plano de preço + features (entitlements) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plano e recursos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.subscription ? (
              <div className="space-y-1 rounded-md border border-border/60 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Assinatura</span>
                  <span className="font-medium">
                    {SUBSCRIPTION_LABEL[data.subscription.status] ??
                      data.subscription.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium tabular">
                    {formatCurrency(data.subscription.amount)}/mês ·{" "}
                    {data.subscription.billedUsers}{" "}
                    {data.subscription.billedUsers === 1
                      ? "usuário"
                      : "usuários"}
                  </span>
                </div>
                {data.subscription.paymentFailedAt ? (
                  <p className="inline-flex items-center gap-1.5 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Pagamento pendente desde{" "}
                    {formatDate(data.subscription.paymentFailedAt)}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem assinatura — o plano abaixo vale como cortesia/negociação.
              </p>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Plano</p>
              <div className="grid grid-cols-2 gap-2">
                {(planDefs ?? []).map((t) => (
                  <Button
                    key={t.id}
                    size="sm"
                    variant={data.tier === t.id ? "default" : "outline"}
                    disabled={entitlements.isPending}
                    onClick={() => entitlements.mutate({ tier: t.id })}
                  >
                    {t.name}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant={data.tier === null ? "default" : "outline"}
                  disabled={entitlements.isPending}
                  onClick={() => entitlements.mutate({ tier: null })}
                >
                  Nenhum
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium">Fundador</p>
                <p className="text-xs text-muted-foreground">
                  {data.founder
                    ? "Ocupa uma das 10 vagas"
                    : "Não ocupa vaga de fundador"}
                </p>
              </div>
              <Button
                size="sm"
                variant={data.founder ? "outline" : "secondary"}
                disabled={entitlements.isPending}
                onClick={() => entitlements.mutate({ founder: !data.founder })}
              >
                {data.founder ? "Remover marca" : "Marcar como fundador"}
              </Button>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                Recursos (exceções por cima do plano)
              </p>
              {ALL_FEATURES.map((feature) => (
                <FeatureRow
                  key={feature}
                  feature={feature}
                  tierFeatures={
                    planDefs?.find((p) => p.id === data.tier)?.features ?? []
                  }
                  override={data.featureOverrides?.[feature]}
                  disabled={entitlements.isPending}
                  onChange={(value) => {
                    const next = { ...(data.featureOverrides ?? {}) };
                    if (value === undefined) delete next[feature];
                    else next[feature] = value;
                    entitlements.mutate({ featureOverrides: next });
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

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

          {session?.role === "OWNER" ? (
            <DangerZone
              companyName={data.name}
              teamCount={data.team.length}
              pending={remove.isPending}
              onDelete={() => remove.mutate()}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Exclusão definitiva da empresa (Firebase + banco). Exige digitar o nome
 * exato para evitar acidente. Só aparece para OWNER.
 */
function DangerZone({
  companyName,
  teamCount,
  pending,
  onDelete,
}: {
  companyName: string;
  teamCount: number;
  pending: boolean;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const matches = confirm.trim() === companyName;

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">
          Excluir empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Apaga <span className="font-medium text-foreground">tudo</span> desta
          empresa — {teamCount} {teamCount === 1 ? "usuário" : "usuários"} no
          Firebase e todos os dados no banco (clientes, vendas, estoque,
          financeiro, loja, assinatura). <strong>Não dá para desfazer.</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          Para confirmar, digite o nome da empresa:{" "}
          <span className="font-medium text-foreground">{companyName}</span>
        </p>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={companyName}
          aria-label="Confirmar nome da empresa"
        />
        <Button
          variant="destructive"
          className="w-full"
          disabled={!matches || pending}
          onClick={onDelete}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Excluir empresa definitivamente
        </Button>
      </CardContent>
    </Card>
  );
}

/** Data local YYYY-MM-DD (sem UTC shift) a partir de um Date. */
function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
}
/** "YYYY-MM-DD" → "DD/MM/YYYY" (à prova de fuso). */
function brDate(value: string): string {
  const [y, m, d] = value.split("-");
  return d && m && y ? `${d}/${m}/${y}` : value;
}

/**
 * Define o fim do período gratuito por uma DATA exata (com calendário), em vez
 * de somar dias — os atalhos +7/+15/+30 só preenchem a data, e nada é aplicado
 * até "Definir". Assim clicar várias vezes não acumula dias sem querer.
 */
function TrialExtender({
  currentEnd,
  busy,
  onSet,
}: {
  currentEnd: string | null;
  busy: boolean;
  onSet: (date: string) => void;
}) {
  const today = ymd(new Date());
  const current = currentEnd ? ymd(new Date(currentEnd)) : "";
  const [date, setDate] = useState(current || inDays(7));

  const valid = date >= today;
  const changed = date !== current;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Fim do período gratuito
      </p>
      <div className="flex gap-2">
        {[7, 15, 30].map((d) => (
          <Button
            key={d}
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => setDate(inDays(d))}
          >
            +{d}d
          </Button>
        ))}
      </div>
      <Input
        type="date"
        min={today}
        value={date}
        disabled={busy}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Data de fim do período gratuito"
      />
      <Button
        size="sm"
        className="w-full"
        disabled={busy || !valid || !changed}
        onClick={() => onSet(date)}
      >
        <CalendarClock className="h-4 w-4" />
        {valid ? `Definir para ${brDate(date)}` : "Escolha uma data futura"}
      </Button>
    </div>
  );
}

const SUBSCRIPTION_LABEL: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  AUTHORIZED: "Ativa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
};

/**
 * Linha de um recurso com o estado efetivo e o override em 3 posições:
 * herdar do plano / ligar / desligar.
 */
function FeatureRow({
  feature,
  tierFeatures,
  override,
  disabled,
  onChange,
}: {
  feature: Feature;
  tierFeatures: Feature[];
  override: boolean | undefined;
  disabled: boolean;
  onChange: (value: boolean | undefined) => void;
}) {
  const effective = override ?? tierFeatures.includes(feature);

  const options: { label: string; value: boolean | undefined }[] = [
    { label: "Plano", value: undefined },
    { label: "Ligado", value: true },
    { label: "Desligado", value: false },
  ];

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <p className="truncate text-sm">{FEATURE_INFO[feature].label}</p>
        <p className="text-xs text-muted-foreground">
          {effective ? "Liberado" : "Bloqueado"}
          {override !== undefined ? " · exceção" : ""}
        </p>
      </div>
      <div className="flex shrink-0 overflow-hidden rounded-md border border-border">
        {options.map((opt) => {
          const selected = override === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={disabled}
              onClick={() => !selected && onChange(opt.value)}
              className={`px-2 py-1 text-xs transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
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
