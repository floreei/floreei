"use client";

import { useParams } from "next/navigation";
import {
  PrintDocHeader,
  PrintDocument,
  printTheadClass,
} from "@/components/shared/print-document";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/lib/api/company";
import { useCustomerProfile } from "@/lib/api/customers";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";

const fmtQty = (q: number): string =>
  Number.isInteger(q)
    ? String(q)
    : q.toFixed(3).replace(/\.?0+$/, "").replace(".", ",");

export default function CustomerStatementPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useCustomerProfile(params.id);
  const { data: settings } = useCompany();
  const { user } = useAuth();
  const company = settings?.name ?? user?.companyName ?? "Floreei";

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { customer, stats, events, topItems } = data;
  const active = events.filter((e) => e.status !== "CANCELED");

  return (
    <PrintDocument
      backHref={`/clientes/${customer.id}`}
      backLabel="Voltar ao cliente"
      footer={
        <>
          Documento não fiscal · gerado por {company} ·{" "}
          {formatDate(new Date().toISOString())}
        </>
      }
    >
      <PrintDocHeader
        settings={settings}
        company={company}
        title="Extrato do cliente"
      />

      <section className="py-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
          Cliente
        </p>
        <p className="mt-1 text-base font-medium">{customer.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-6 text-xs text-muted-foreground">
          {customer.document ? <span>{customer.document}</span> : null}
          {customer.whatsapp || customer.phone ? (
            <span>{customer.whatsapp ?? customer.phone}</span>
          ) : null}
          {customer.email ? <span>{customer.email}</span> : null}
        </div>
      </section>

      <table className="w-full border-collapse overflow-hidden rounded-lg">
        <thead>
          <tr className={printTheadClass}>
            <th className="rounded-l-lg py-2.5 pl-3 text-left font-semibold">Data</th>
            <th className="py-2.5 px-3 text-left font-semibold">Pedido</th>
            <th className="py-2.5 px-3 text-right font-semibold">Vendido</th>
            <th className="py-2.5 px-3 text-right font-semibold">Recebido</th>
            <th className="rounded-r-lg py-2.5 pr-3 text-right font-semibold">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {active.length > 0 ? (
            active.map((event) => (
              <tr key={event.id} className="border-b border-border/50">
                <td className="py-2.5 pl-3 text-muted-foreground">
                  {formatDate(event.date)}
                </td>
                <td className="py-2.5 px-3">{event.title}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {formatCurrency(event.soldValue)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(event.receivedValue)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {formatCurrency(event.soldValue - event.receivedValue)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-border/50">
              <td className="py-2.5 pl-3 text-muted-foreground" colSpan={5}>
                Nenhum pedido registrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-2 rounded-xl bg-secondary/50 px-5 py-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total vendido</span>
            <span className="tabular-nums">{formatCurrency(stats.totalSold)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total recebido</span>
            <span className="tabular-nums text-success">
              {formatCurrency(stats.totalReceived)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-primary/15 pt-3">
            <span className="font-semibold">Saldo a receber</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(stats.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {topItems.length > 0 ? (
        <section className="mt-8 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Itens mais vendidos
          </p>
          <ul className="mt-2 space-y-1">
            {topItems.map((it) => (
              <li key={it.name} className="flex justify-between">
                <span>
                  {fmtQty(it.quantity)}x {it.name}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(it.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PrintDocument>
  );
}
