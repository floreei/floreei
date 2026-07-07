"use client";

import { useParams } from "next/navigation";
import {
  PrintDocHeader,
  PrintDocument,
  printTheadClass,
} from "@/components/shared/print-document";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/lib/api/company";
import { useSupplierProfile } from "@/lib/api/suppliers";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";

const fmtQty = (q: number): string =>
  Number.isInteger(q)
    ? String(q)
    : q.toFixed(3).replace(/\.?0+$/, "").replace(".", ",");

export default function SupplierStatementPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useSupplierProfile(params.id);
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

  const { supplier, stats, purchases, topItems } = data;
  const active = purchases.filter((p) => p.status !== "CANCELED");

  return (
    <PrintDocument
      backHref={`/fornecedores/${supplier.id}`}
      backLabel="Voltar ao fornecedor"
      documentTitle={`${supplier.name} — Floreei — Extrato`}
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
        title="Extrato do fornecedor"
      />

      <section className="py-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
          Fornecedor
        </p>
        <p className="mt-1 text-base font-medium">{supplier.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-6 text-xs text-muted-foreground">
          {supplier.city ? <span>{supplier.city}</span> : null}
          {supplier.whatsapp || supplier.contact ? (
            <span>{supplier.whatsapp ?? supplier.contact}</span>
          ) : null}
          {supplier.paymentTerms ? <span>{supplier.paymentTerms}</span> : null}
        </div>
      </section>

      <table className="w-full border-collapse overflow-hidden rounded-lg">
        <thead>
          <tr className={printTheadClass}>
            <th className="rounded-l-lg py-2.5 pl-3 text-left font-semibold">Data</th>
            <th className="py-2.5 px-3 text-right font-semibold">Total</th>
            <th className="py-2.5 px-3 text-right font-semibold">Pago</th>
            <th className="rounded-r-lg py-2.5 pr-3 text-right font-semibold">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {active.length > 0 ? (
            active.map((purchase) => (
              <tr key={purchase.id} className="border-b border-border/50">
                <td className="py-2.5 pl-3 text-muted-foreground">
                  {formatDate(purchase.date)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {formatCurrency(purchase.total)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(purchase.paidAmount)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {formatCurrency(purchase.balanceDue)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-border/50">
              <td className="py-2.5 pl-3 text-muted-foreground" colSpan={4}>
                Nenhuma compra registrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-2 rounded-xl bg-secondary/50 px-5 py-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total comprado</span>
            <span className="tabular-nums">{formatCurrency(stats.totalPurchased)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total pago</span>
            <span className="tabular-nums text-success">
              {formatCurrency(stats.totalPaid)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-primary/15 pt-3">
            <span className="font-semibold">Saldo a pagar</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(stats.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {topItems.length > 0 ? (
        <section className="mt-8 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Itens mais comprados
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
