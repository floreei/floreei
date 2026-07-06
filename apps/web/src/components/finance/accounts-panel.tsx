"use client";

import type { OpenAccount } from "@sistema-flores/types";
import { CheckCircle2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isOverdue } from "@/lib/finance-period";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Mode = "receive" | "pay";
type StatusFilter = "all" | "overdue" | "upcoming";

export function AccountsPanel({
  receivables,
  payables,
  loading,
  onAction,
}: {
  receivables: OpenAccount[];
  payables: OpenAccount[];
  loading: boolean;
  onAction: (mode: Mode, account: OpenAccount) => void;
}) {
  return (
    <Tabs defaultValue="receivables">
      <TabsList>
        <TabsTrigger value="receivables">
          A receber{!loading ? ` (${receivables.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="payables">
          A pagar{!loading ? ` (${payables.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="receivables">
        <AccountsTab
          loading={loading}
          accounts={receivables}
          partyLabel="Cliente"
          actionLabel="Receber"
          mode="receive"
          emptyTitle="Nada a receber"
          emptyDescription="Todos os eventos estão quitados."
          onAction={onAction}
        />
      </TabsContent>
      <TabsContent value="payables">
        <AccountsTab
          loading={loading}
          accounts={payables}
          partyLabel="Fornecedor"
          actionLabel="Pagar"
          mode="pay"
          emptyTitle="Nada a pagar"
          emptyDescription="Nenhuma compra com saldo em aberto."
          onAction={onAction}
        />
      </TabsContent>
    </Tabs>
  );
}

function AccountsTab({
  loading,
  accounts,
  partyLabel,
  actionLabel,
  mode,
  emptyTitle,
  emptyDescription,
  onAction,
}: {
  loading: boolean;
  accounts: OpenAccount[];
  partyLabel: string;
  actionLabel: string;
  mode: Mode;
  emptyTitle: string;
  emptyDescription: string;
  onAction: (mode: Mode, account: OpenAccount) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const aging = useMemo(() => {
    const overdue = accounts.filter((a) => isOverdue(a.date));
    const upcoming = accounts.filter((a) => !isOverdue(a.date));
    const sum = (l: OpenAccount[]) => l.reduce((s, a) => s + a.balanceDue, 0);
    return {
      overdue: { total: sum(overdue), count: overdue.length },
      upcoming: { total: sum(upcoming), count: upcoming.length },
    };
  }, [accounts]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts
      .filter((a) => {
        if (filter === "overdue" && !isOverdue(a.date)) return false;
        if (filter === "upcoming" && isOverdue(a.date)) return false;
        if (q) {
          return (
            a.partyName.toLowerCase().includes(q) ||
            a.title.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [accounts, search, filter]);

  if (loading) {
    return (
      <Card>
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          className="border-0"
          icon={<CheckCircle2 />}
          title={emptyTitle}
          description={emptyDescription}
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <AgingChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Todas"
            tone="neutral"
          />
          <AgingChip
            active={filter === "overdue"}
            onClick={() => setFilter("overdue")}
            label={`Vencidas · ${formatCurrency(aging.overdue.total)} (${aging.overdue.count})`}
            tone="danger"
          />
          <AgingChip
            active={filter === "upcoming"}
            onClick={() => setFilter("upcoming")}
            label={`A vencer · ${formatCurrency(aging.upcoming.total)} (${aging.upcoming.count})`}
            tone="neutral"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`Buscar ${partyLabel.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma conta com esses filtros.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{partyLabel}</TableHead>
              <TableHead className="hidden lg:table-cell">Referência</TableHead>
              <TableHead className="hidden md:table-cell">Vencimento</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Total</TableHead>
              <TableHead className="hidden text-right md:table-cell">Pago</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="sm:w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((account) => {
              const overdue = isOverdue(account.date);
              return (
                <TableRow key={`${account.kind}-${account.id}`}>
                  <TableCell className="font-medium">
                    {account.partyName}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {account.title}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        overdue
                          ? "font-medium text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {overdue ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      ) : null}
                      {formatDate(account.date)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    {formatCurrency(account.total)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                    {formatCurrency(account.paid)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold tabular-nums",
                      overdue ? "text-destructive" : "text-clay",
                    )}
                  >
                    {formatCurrency(account.balanceDue)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAction(mode, account)}
                    >
                      {actionLabel}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function AgingChip({
  active,
  onClick,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  tone: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border px-3 text-xs font-medium tabular-nums transition-colors",
        active
          ? tone === "danger"
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
