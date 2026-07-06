"use client";

import type {
  CompanyAccessStatus,
  CompanyListItem,
  Paginated,
} from "@sistema-flores/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { cn, describeInactivity, formatCurrency, formatNumber } from "@/lib/utils";

const STATUS_FILTERS: { value: CompanyAccessStatus | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "TRIAL", label: "Período gratuito" },
  { value: "ACTIVE", label: "Ativas" },
  { value: "EXPIRED", label: "Expiradas" },
  { value: "SUSPENDED", label: "Suspensas" },
];

const SORTS: { value: string; label: string }[] = [
  { value: "lastSeen", label: "Último acesso" },
  { value: "recent", label: "Mais recentes" },
  { value: "revenue", label: "Maior receita" },
  { value: "name", label: "Nome (A–Z)" },
];

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function CompaniesInner() {
  const params = useSearchParams();
  const [status, setStatus] = useState<CompanyAccessStatus | "">(
    (params.get("status") as CompanyAccessStatus) ?? "",
  );
  const [risk, setRisk] = useState(params.get("risk") === "true");
  const [sort, setSort] = useState(params.get("sort") ?? "lastSeen");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const debouncedSearch = useDebounced(search);

  // Volta para a 1ª página sempre que os filtros/busca/ordenação mudam.
  useEffect(() => {
    setPage(1);
  }, [status, risk, sort, debouncedSearch]);

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ["companies", { status, risk, sort, search: debouncedSearch, page }],
    queryFn: () =>
      api.get<Paginated<CompanyListItem>>("/admin/companies", {
        status: status || undefined,
        risk: risk ? "true" : undefined,
        sort,
        search: debouncedSearch || undefined,
        page,
        pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold">Empresas</h1>
        <p className="text-muted-foreground">
          Acesso, uso e volume de cada cliente.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar empresa pelo nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                status === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setRisk((r) => !r)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              risk
                ? "border-warning bg-warning/15 text-warning"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            Em risco
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-auto h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar.</p>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhuma empresa encontrada com esses filtros.
        </Card>
      ) : (
        <Card
          className={cn(
            "overflow-hidden transition-opacity",
            isPlaceholderData && "opacity-60",
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Último acesso</th>
                  <th className="px-4 py-3 text-right font-medium">Usuários</th>
                  <th className="px-4 py-3 text-right font-medium">Vendas</th>
                  <th className="px-4 py-3 text-right font-medium">Receita</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/empresas/${c.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                      {c.atRisk ? (
                        <span className="ml-2 text-xs text-warning">• em risco</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={c.status}
                        trialDaysLeft={c.trialDaysLeft}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {describeInactivity(c.daysInactive)}
                    </td>
                    <td className="px-4 py-3 text-right tabular">{c.users}</td>
                    <td className="px-4 py-3 text-right tabular">
                      {formatNumber(c.sales)}
                    </td>
                    <td className="px-4 py-3 text-right tabular">
                      {formatCurrency(c.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data && data.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {(data.page - 1) * data.pageSize + 1}–
            {Math.min(data.page * data.pageSize, data.total)} de {data.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || isPlaceholderData}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="tabular">
              {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages || isPlaceholderData}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CompaniesInner />
    </Suspense>
  );
}
