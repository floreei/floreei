"use client";

import type { QuoteStatus } from "@sistema-flores/types";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuotes } from "@/lib/api/quotes";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

const filters: Array<{ label: string; value?: QuoteStatus }> = [
  { label: "Todos" },
  { label: "Rascunhos", value: "DRAFT" },
  { label: "Enviados", value: "SENT" },
  { label: "Aprovados", value: "APPROVED" },
];

export default function QuotesPage() {
  const [status, setStatus] = useState<QuoteStatus | undefined>();
  const { data, isLoading } = useQuotes({ status });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        description="Monte propostas e acompanhe a conversão em eventos."
      >
        <Button asChild>
          <Link href="/orcamentos/novo">
            <Plus className="h-4 w-4" />
            Novo orçamento
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatus(f.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              status === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() => {
                    window.location.href = `/orcamentos/${quote.id}`;
                  }}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{quote.number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {quote.customer?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(quote.totalSale)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatPercent(quote.marginPct)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            className="border-0"
            icon={<FileText />}
            title="Nenhum orçamento"
            description="Crie um orçamento para um cliente e calcule o lucro automaticamente."
            action={
              <Button asChild>
                <Link href="/orcamentos/novo">
                  <Plus className="h-4 w-4" />
                  Novo orçamento
                </Link>
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
}
