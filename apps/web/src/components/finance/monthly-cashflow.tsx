"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyCashflow } from "@/lib/api/finance";
import { shortMonth } from "@/lib/finance-period";
import { CashflowChart } from "./cashflow-chart";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const monthLong = (y: number, m: number) =>
  cap(
    new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      new Date(y, m, 1),
    ),
  );

export function MonthlyCashflowCard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useMonthlyCashflow(year);

  const points = (data?.months ?? []).map((mp) => ({
    label: cap(shortMonth(year, mp.month - 1)),
    fullLabel: monthLong(year, mp.month - 1),
    entradas: mp.entradas,
    saidas: mp.saidas,
    saldo: mp.saldo,
  }));

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Fluxo de caixa mensal</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Ano anterior"
              onClick={() => setYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm font-medium tabular-nums">
              {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Próximo ano"
              disabled={year >= currentYear}
              onClick={() => setYear((y) => Math.min(currentYear, y + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : (
          <CashflowChart points={points} unit="mês" />
        )}
      </CardContent>
    </Card>
  );
}
