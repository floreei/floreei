"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReport } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, isLoading } = useReport(from || undefined, to || undefined);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="O desempenho do seu negócio no período — receita, lucro e rankings."
      >
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs">De</Label>
            <Input
              id="from"
              type="date"
              className="h-9"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs">Até</Label>
            <Input
              id="to"
              type="date"
              className="h-9"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Receita" value={data?.summary.revenue} loading={isLoading} />
        <SummaryCard
          label="Custo de compras"
          value={data?.summary.purchasesCost}
          loading={isLoading}
        />
        <SummaryCard
          label="Lucro bruto"
          value={data?.summary.grossProfit}
          loading={isLoading}
          accent
        />
        <SummaryCard
          label="Eventos"
          value={data?.summary.eventsCount}
          loading={isLoading}
          money={false}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <RankTable
            loading={isLoading}
            empty="Sem vendas no período."
            head={["Produto", "Qtd.", "Receita", "Lucro"]}
            rows={
              data?.topProducts.map((p) => [
                p.name,
                String(p.quantity),
                formatCurrency(p.revenue),
                formatCurrency(p.profit),
              ]) ?? []
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clientes que mais compraram</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable
              loading={isLoading}
              empty="Sem clientes no período."
              head={["Cliente", "Eventos", "Total"]}
              rows={
                data?.customers.map((c) => [
                  c.name,
                  String(c.count),
                  formatCurrency(c.total),
                ]) ?? []
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compras por fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <RankTable
              loading={isLoading}
              empty="Sem compras no período."
              head={["Fornecedor", "Compras", "Total"]}
              rows={
                data?.suppliers.map((s) => [
                  s.name,
                  String(s.count),
                  formatCurrency(s.total),
                ]) ?? []
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading,
  accent,
  money = true,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  accent?: boolean;
  money?: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p
            className={`text-2xl font-semibold tracking-tight ${accent ? "text-success" : ""}`}
          >
            {money ? formatCurrency(value ?? 0) : (value ?? 0)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RankTable({
  loading,
  head,
  rows,
  empty,
}: {
  loading: boolean;
  head: string[];
  rows: string[][];
  empty: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head.map((h, i) => (
            <TableHead key={h} className={i === 0 ? "" : "text-right"}>
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, ri) => (
          <TableRow key={ri}>
            {row.map((cell, ci) => (
              <TableCell
                key={ci}
                className={
                  ci === 0
                    ? "font-medium"
                    : "text-right tabular-nums text-muted-foreground"
                }
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
