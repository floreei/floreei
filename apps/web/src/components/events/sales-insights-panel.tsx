"use client";

import {
  roundMoney,
  type AtRiskCustomer,
  type IdleItem,
  type PartyRanking,
  type PendingDeliveries,
  type PendingDeliveryItem,
  type PendingDeliverySale,
  type SoldItemRanking,
} from "@sistema-flores/types";
import {
  Check,
  Copy,
  Flower,
  Package,
  Printer,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RankingList, type RankRow } from "@/components/reports/ranking-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSalesInsights,
  type SalesInsightsFilters,
} from "@/lib/api/events";
import {
  addQuantity,
  buildDaySummary,
  daySummaryText,
  saleDay,
  summaryDayHeading,
  summaryLineText,
  type DaySummaryLine,
} from "@/lib/delivery-summary";
import { unitLabels } from "@/lib/labels";
import { fmtQty } from "@/lib/whatsapp";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateWithWeekday,
  formatWeekdayShort,
} from "@/lib/utils";

function itemRows(items: SoldItemRanking[]): RankRow[] {
  return items.map((i) => ({
    id: `${i.kind}:${i.id}`,
    name: i.name,
    value: i.quantity,
    valueLabel: `${i.quantity} vend.`,
    sub: formatCurrency(i.revenue),
  }));
}

function customerRows(rows: PartyRanking[]): RankRow[] {
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    value: c.total,
    valueLabel: formatCurrency(c.total),
    sub: `${c.count} venda${c.count === 1 ? "" : "s"}`,
  }));
}

/** Insights práticos da tela de Vendas, respeitando período e filtros da tela. */
export function SalesInsightsPanel({ filters }: { filters: SalesInsightsFilters }) {
  const { data, isLoading } = useSalesInsights(filters);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4 p-5 lg:col-span-2">
        <SectionTitle
          icon={<Truck className="h-4 w-4" />}
          title="Entregas"
          hint="Pedidos agrupados pelo dia de entrega (ou da venda, se não houver) dentro do período — pendentes, já entregues e o total. Desmarque um pedido para tirá-lo da contagem."
        />
        <DeliveriesSection
          pending={data?.pendingDeliveries}
          delivered={data?.delivered}
          period={data ? `${formatDate(data.from)} a ${formatDate(data.to)}` : ""}
          loading={isLoading}
        />
      </Card>

      <Card className="space-y-5 p-5">
        <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Mais vendidos" />
        <RankingList
          rows={itemRows(data?.topItems ?? [])}
          loading={isLoading}
          empty="Nenhuma venda no período."
        />
        <div className="border-t border-border pt-4">
          <SectionTitle
            icon={<TrendingDown className="h-4 w-4" />}
            title="Parados (0 vendas no período)"
            hint="Encalhados — vale um empurrão."
          />
          <IdleList items={data?.idleItems ?? []} loading={isLoading} />
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <SectionTitle icon={<Users className="h-4 w-4" />} title="Quem mais comprou" />
        <RankingList
          rows={customerRows(data?.topCustomers ?? [])}
          loading={isLoading}
          empty="Nenhuma venda com cliente no período."
          tone="clay"
        />
        <div className="border-t border-border pt-4">
          <SectionTitle
            icon={<TrendingDown className="h-4 w-4" />}
            title="Clientes em risco"
            hint="Compraram antes e sumiram no período."
          />
          <AtRiskList rows={data?.atRiskCustomers ?? []} loading={isLoading} />
        </div>
      </Card>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function IdleList({ items, loading }: { items: IdleItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Tudo girou no período. 🎉
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-border">
      {items.map((item) => (
        <li
          key={`${item.kind}:${item.id}`}
          className="flex items-center justify-between gap-3 py-2"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="text-muted-foreground">
              {item.kind === "arrangement" ? (
                <Flower className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
            </span>
            <span className="truncate text-sm">{item.name}</span>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {item.lastSoldAt
              ? `última ${formatDate(item.lastSoldAt)}`
              : "nunca vendeu"}
          </span>
        </li>
      ))}
    </ul>
  );
}

type DeliveryView = "pending" | "delivered" | "total";

const deliveryViews: Record<
  DeliveryView,
  {
    label: string;
    empty: string;
    totalLabel: string;
    /** Como chamar cada venda da aba: [singular, plural]. */
    saleNoun: [string, string];
  }
> = {
  pending: {
    label: "Falta entregar",
    empty: "Nada pendente de entrega no período.",
    totalLabel: "Valor total a entregar",
    saleNoun: ["entrega", "entregas"],
  },
  delivered: {
    label: "Já entregue",
    empty: "Nenhuma entrega concluída no período.",
    totalLabel: "Valor total entregue",
    saleNoun: ["entrega", "entregas"],
  },
  total: {
    label: "Total",
    empty: "Nenhuma venda no período.",
    totalLabel: "Valor total do período",
    saleNoun: ["venda", "vendas"],
  },
};
const deliveryViewOrder: DeliveryView[] = ["pending", "delivered", "total"];

interface DeliveryCount {
  included: PendingDeliverySale[];
  totalQuantity: number;
  salesCount: number;
  totalValue: number;
}

const itemKey = (item: PendingDeliveryItem) =>
  `${item.kind}:${item.id}:${item.unit}`;
const quantityOf = (s: PendingDeliverySale) =>
  s.items.reduce((sum, i) => addQuantity(sum, i.quantity), 0);

/** Contagem só dos pedidos marcados. */
function countDeliveries(
  sales: PendingDeliverySale[],
  excluded: ReadonlySet<string>,
): DeliveryCount {
  const included = sales.filter((s) => !excluded.has(s.id));
  return {
    included,
    totalQuantity: included.reduce((sum, s) => addQuantity(sum, quantityOf(s)), 0),
    salesCount: included.length,
    totalValue: roundMoney(included.reduce((sum, s) => sum + s.totalValue, 0)),
  };
}

/** Mesma ordem da API: dia efetivo, nome do cliente, id. */
const bySaleOrder = (a: PendingDeliverySale, b: PendingDeliverySale) =>
  saleDay(a).localeCompare(saleDay(b)) ||
  (a.customerName ?? "").localeCompare(b.customerName ?? "", "pt-BR") ||
  a.id.localeCompare(b.id);

/** Pendentes + entregues numa lista só (aba "Total"), sem somar pedidos. */
function mergeDeliveries(
  pending: PendingDeliveries,
  delivered: PendingDeliveries,
): PendingDeliveries {
  return {
    salesCount: pending.salesCount + delivered.salesCount,
    totalQuantity: addQuantity(pending.totalQuantity, delivered.totalQuantity),
    totalValue: roundMoney(pending.totalValue + delivered.totalValue),
    sales: [...pending.sales, ...delivered.sales].sort(bySaleOrder),
  };
}

/** Pedidos agrupados pelo dia efetivo, mantendo a ordem recebida. */
function groupByDay(
  sales: PendingDeliverySale[],
): Array<{ date: string; sales: PendingDeliverySale[] }> {
  const days: Array<{ date: string; sales: PendingDeliverySale[] }> = [];
  for (const sale of sales) {
    const date = saleDay(sale);
    const last = days[days.length - 1];
    if (last && last.date === date) last.sales.push(sale);
    else days.push({ date, sales: [sale] });
  }
  return days;
}

/**
 * Abas "Falta entregar" / "Já entregue" / "Total", cada uma com a própria
 * contagem.
 */
function DeliveriesSection({
  pending,
  delivered,
  period,
  loading,
}: {
  pending: PendingDeliveries | undefined;
  delivered: PendingDeliveries | undefined;
  /** "01/10/2026 a 31/10/2026" — vai no título do resumo exportado. */
  period: string;
  loading: boolean;
}) {
  const [view, setView] = useState<DeliveryView>("pending");
  // Pedidos desmarcados saem da contagem (só na tela — não altera nada no
  // servidor), separados por aba. Ids que sumirem com a troca de filtros são
  // simplesmente ignorados.
  const [excluded, setExcluded] = useState<
    Record<DeliveryView, ReadonlySet<string>>
  >({ pending: new Set(), delivered: new Set(), total: new Set() });

  if (loading || !pending || !delivered) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const data = { pending, delivered, total: mergeDeliveries(pending, delivered) };
  const counts = {
    pending: countDeliveries(data.pending.sales, excluded.pending),
    delivered: countDeliveries(data.delivered.sales, excluded.delivered),
    total: countDeliveries(data.total.sales, excluded.total),
  };

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as DeliveryView)}>
      <TabsList className="h-auto w-full sm:w-auto">
        {deliveryViewOrder.map((v) => {
          const quantity = counts[v].totalQuantity;
          return (
            <TabsTrigger
              key={v}
              value={v}
              className="min-h-11 flex-1 flex-col gap-x-1.5 px-2 sm:flex-none sm:flex-row sm:px-3 lg:min-h-9"
            >
              {deliveryViews[v].label}
              <span className="text-xs font-normal tabular-nums sm:text-sm">
                <span aria-hidden className="hidden sm:inline">
                  ·{" "}
                </span>
                {fmtQty(quantity)} {quantity === 1 ? "item" : "itens"}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      {deliveryViewOrder.map((v) => (
        <TabsContent key={v} value={v} className="mt-3">
          <DeliveriesList
            view={v}
            data={data[v]}
            count={counts[v]}
            period={period}
            excluded={excluded[v]}
            onExcludedChange={(next) =>
              setExcluded((prev) => ({ ...prev, [v]: next }))
            }
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function DeliveriesList({
  view,
  data,
  count,
  period,
  excluded,
  onExcludedChange,
}: {
  view: DeliveryView;
  data: PendingDeliveries;
  count: DeliveryCount;
  period: string;
  excluded: ReadonlySet<string>;
  onExcludedChange: (next: ReadonlySet<string>) => void;
}) {
  if (data.salesCount === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {deliveryViews[view].empty}
      </p>
    );
  }

  const { included, totalQuantity, salesCount, totalValue } = count;
  const [saleSingular, salePlural] = deliveryViews[view].saleNoun;
  const hiddenCount = data.sales.length - included.length;
  const noneIncluded = included.length === 0;
  const toggle = (id: string) => {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onExcludedChange(next);
  };
  const toggleAll = () =>
    onExcludedChange(
      noneIncluded ? new Set() : new Set(data.sales.map((s) => s.id)),
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {fmtQty(totalQuantity)}
          </span>{" "}
          {totalQuantity === 1 ? "item" : "itens"} em{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {salesCount}
          </span>{" "}
          {salesCount === 1 ? saleSingular : salePlural}
          {hiddenCount > 0 ? (
            <span>
              {" "}
              · {hiddenCount} {hiddenCount === 1 ? "pedido fora" : "pedidos fora"}{" "}
              da contagem
            </span>
          ) : null}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0"
          onClick={toggleAll}
        >
          {noneIncluded ? "Marcar todos" : "Desmarcar todos"}
        </Button>
      </div>
      <div className="space-y-4">
        {groupByDay(data.sales).map(({ date, sales }) => (
          <section key={date}>
            <h4 className="text-sm font-semibold first-letter:uppercase">
              {formatDateWithWeekday(date)}
            </h4>
            <ul className="divide-y divide-border">
              {sales.map((sale) => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  active={!excluded.has(sale.id)}
                  onToggle={() => toggle(sale.id)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <DeliveryTotals
        sales={included}
        totalValue={totalValue}
        totalLabel={deliveryViews[view].totalLabel}
      />
      <DaySummary
        sales={included}
        title={`Entregas — ${deliveryViews[view].label}`}
        period={period}
      />
    </div>
  );
}

/** Um pedido: checkbox de contagem, cliente, valor e itens. */
function SaleRow({
  sale,
  active,
  onToggle,
}: {
  sale: PendingDeliverySale;
  active: boolean;
  onToggle: () => void;
}) {
  const name = sale.customerName ?? "Sem cliente";
  return (
    <li className={cn("py-2.5 transition-opacity", !active && "opacity-45")}>
      <div className="flex items-center justify-between gap-3">
        <label className="flex min-h-[44px] min-w-0 cursor-pointer flex-wrap items-center gap-x-2.5 gap-y-0.5">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-primary"
            checked={active}
            onChange={onToggle}
            aria-label={`Incluir pedido de ${name} em ${formatWeekdayShort(saleDay(sale))} na contagem`}
          />
          <span className="truncate text-sm font-medium">{name}</span>
          {sale.deliveryDate ? null : (
            <span
              className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              title="Pedido sem data de entrega combinada — mostrado pela data da venda."
            >
              data da venda
            </span>
          )}
        </label>
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {formatCurrency(sale.totalValue)}
        </span>
      </div>
      {sale.items.length > 0 ? (
        <ul className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 pl-[26px]">
          {sale.items.map((item) => (
            <li key={itemKey(item)} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {fmtQty(item.quantity)}
              </span>{" "}
              {(unitLabels[item.unit] ?? item.unit).toLowerCase()}
              {item.quantity === 1 ? "" : "s"} — {item.name}{" "}
              <span className="tabular-nums">({formatCurrency(item.value)})</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-0.5 pl-[26px] text-xs text-muted-foreground">
          Venda de valor livre (sem itens detalhados).
        </p>
      )}
    </li>
  );
}

/** Somatório por produto (só pedidos marcados) + valor total. */
function DeliveryTotals({
  sales,
  totalValue,
  totalLabel,
}: {
  sales: PendingDeliverySale[];
  totalValue: number;
  totalLabel: string;
}) {
  const totals = new Map<string, PendingDeliveryItem>();
  for (const s of sales) {
    for (const item of s.items) {
      const key = itemKey(item);
      const prev = totals.get(key);
      if (prev) {
        prev.quantity = addQuantity(prev.quantity, item.quantity);
        prev.value = roundMoney(prev.value + item.value);
      } else {
        totals.set(key, { ...item });
      }
    }
  }
  const rows = [...totals.values()].sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {rows.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total por produto
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {rows.map((item) => (
              <li
                key={itemKey(item)}
                className="text-sm text-muted-foreground"
              >
                <span className="font-semibold text-foreground tabular-nums">
                  {fmtQty(item.quantity)}
                </span>{" "}
                {(unitLabels[item.unit] ?? item.unit).toLowerCase()}
                {item.quantity === 1 ? "" : "s"} — {item.name}{" "}
                <span className="tabular-nums">
                  ({formatCurrency(item.value)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">{totalLabel}</span>
        <span className="font-semibold tabular-nums">
          {formatCurrency(totalValue)}
        </span>
      </p>
    </div>
  );
}

/** Linhas do resumo agrupadas por dia, para a tela e para a impressão. */
function groupSummaryByDay(
  lines: DaySummaryLine[],
): Array<{ date: string; lines: DaySummaryLine[] }> {
  const days: Array<{ date: string; lines: DaySummaryLine[] }> = [];
  for (const line of lines) {
    const last = days[days.length - 1];
    if (last && last.date === line.date) last.lines.push(line);
    else days.push({ date: line.date, lines: [line] });
  }
  return days;
}

/**
 * "O que vai para a rua": quantidade por produto e dia, SEM preço, com
 * Copiar (texto puro) e Imprimir / Salvar PDF (só este bloco sai no papel).
 */
function DaySummary({
  sales,
  title,
  period,
}: {
  sales: PendingDeliverySale[];
  title: string;
  period: string;
}) {
  const lines = useMemo(() => buildDaySummary(sales), [sales]);
  const [copied, setCopied] = useState(false);
  if (lines.length === 0) return null;

  const days = groupSummaryByDay(lines);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(daySummaryText({ title, period, lines }));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (contexto inseguro): o texto segue visível na tela.
    }
  };
  const print = () => {
    // Liga o modo "só o resumo" (CSS abaixo) e troca o título da aba, que vira
    // o nome do arquivo quando o navegador salva em PDF. Tudo volta no afterprint.
    const previous = document.title;
    const restore = () => {
      document.body.classList.remove(PRINT_MODE_CLASS);
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    document.body.classList.add(PRINT_MODE_CLASS);
    document.title = `${title} — ${period}`;
    window.print();
  };

  return (
    <div data-testid="day-summary" className="space-y-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resumo por dia
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tipo, quantidade e dia — sem preço. Para copiar ou imprimir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={copy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={print}
          >
            <Printer className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>
      <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => (
          <li key={day.date}>
            <p className="text-sm font-semibold">{summaryDayHeading(day.date)}</p>
            <ul className="mt-0.5 space-y-0.5">
              {day.lines.map((line) => (
                <li
                  key={summaryKey(line)}
                  className="text-sm tabular-nums text-muted-foreground"
                >
                  {summaryLineText(line)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <DaySummaryPrint title={title} period={period} days={days} />
    </div>
  );
}

const summaryKey = (line: DaySummaryLine) => `${line.kind}:${line.id}:${line.unit}`;

/** Classe no <body> enquanto o resumo está sendo impresso. */
const PRINT_MODE_CLASS = "printing-delivery-summary";
const PRINT_ID = "delivery-summary-print";

/**
 * Versão para papel do resumo: vai num portal direto no <body>, invisível na
 * tela. Só quando o botão Imprimir liga `PRINT_MODE_CLASS` é que o resto da
 * página sai do fluxo (display:none, sem páginas em branco) e este bloco
 * aparece. Um Ctrl+P avulso continua imprimindo a página normal.
 */
function DaySummaryPrint({
  title,
  period,
  days,
}: {
  title: string;
  period: string;
  days: Array<{ date: string; lines: DaySummaryLine[] }>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => document.body.classList.remove(PRINT_MODE_CLASS);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        @media print {
          body.${PRINT_MODE_CLASS} > *:not(#${PRINT_ID}) { display: none !important; }
          body.${PRINT_MODE_CLASS} #${PRINT_ID} { display: block !important; }
          @page { margin: 14mm; }
        }
      `}</style>
      <div id={PRINT_ID} className="hidden bg-white text-black">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-base">{period}</p>
        <div className="mt-6 space-y-5">
          {days.map((day) => (
            <section key={day.date}>
              <h2 className="border-b border-black/30 pb-1 text-lg font-semibold">
                {summaryDayHeading(day.date)}
              </h2>
              <ul className="mt-2 space-y-1 text-lg tabular-nums">
                {day.lines.map((line) => (
                  <li key={summaryKey(line)}>{summaryLineText(line)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>,
    document.body,
  );
}

function AtRiskList({
  rows,
  loading,
}: {
  rows: AtRiskCustomer[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Ninguém sumiu no período.
      </p>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-border">
      {rows.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{c.name}</span>
            <span className="block text-xs text-muted-foreground">
              {c.lastPurchaseAt
                ? `última compra ${formatDate(c.lastPurchaseAt)}`
                : "sem compras"}
            </span>
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatCurrency(c.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}
