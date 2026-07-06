"use client";

import { useParams } from "next/navigation";
import {
  PrintDocHeader,
  PrintDocument,
  printTheadClass,
} from "@/components/shared/print-document";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/lib/api/company";
import { usePurchase } from "@/lib/api/purchases";
import { useAuth } from "@/lib/auth/auth-context";
import { unitLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchaseNotePage() {
  const params = useParams<{ id: string }>();
  const { data: purchase, isLoading } = usePurchase(params.id);
  const { data: settings } = useCompany();
  const { user } = useAuth();
  const company = settings?.name ?? user?.companyName ?? "Floreei";

  if (isLoading || !purchase) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const pending = purchase.total - purchase.paidAmount;
  const ref = purchase.id.slice(0, 8).toUpperCase();

  return (
    <PrintDocument
      backHref={`/compras/${purchase.id}`}
      backLabel="Voltar à compra"
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
        title="Pedido de compra"
        subtitle={`Pedido nº ${ref}`}
      />

      <section className="grid grid-cols-2 gap-4 py-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Fornecedor
          </p>
          <p className="mt-1 font-medium">{purchase.supplier?.name ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Data da compra
          </p>
          <p className="mt-1 font-medium">{formatDate(purchase.date)}</p>
          {purchase.deliveryDate ? (
            <p className="text-xs text-muted-foreground">
              Entrega: {formatDate(purchase.deliveryDate)}
            </p>
          ) : null}
        </div>
      </section>

      <table className="w-full border-collapse overflow-hidden rounded-lg">
        <thead>
          <tr className={printTheadClass}>
            <th className="rounded-l-lg py-2.5 pl-3 text-left font-semibold">Item</th>
            <th className="py-2.5 px-3 text-right font-semibold">Qtd.</th>
            <th className="py-2.5 px-3 text-right font-semibold">Valor unit.</th>
            <th className="rounded-r-lg py-2.5 pr-3 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {purchase.items.length > 0 ? (
            purchase.items.map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-2.5 pl-3">{item.description}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {item.quantity} {unitLabels[item.unit].toLowerCase()}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-border/50">
              <td className="py-2.5 pl-3" colSpan={4}>
                Sem itens detalhados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-2 rounded-xl bg-secondary/50 px-5 py-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Itens</span>
            <span className="tabular-nums">{formatCurrency(purchase.itemsTotal)}</span>
          </div>
          {purchase.freight > 0 ? (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Frete</span>
              <span className="tabular-nums">{formatCurrency(purchase.freight)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-y border-primary/15 py-3">
            <span className="font-semibold">Total</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(purchase.total)}
            </span>
          </div>
          {purchase.paidAmount > 0 ? (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Pago</span>
              <span className="tabular-nums text-success">
                {formatCurrency(purchase.paidAmount)}
              </span>
            </div>
          ) : null}
          {pending > 0 ? (
            <div className="flex items-center justify-between font-medium">
              <span>A pagar</span>
              <span className="tabular-nums text-clay">{formatCurrency(pending)}</span>
            </div>
          ) : null}
        </div>
      </div>

      {purchase.notes ? (
        <section className="mt-8 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Observações
          </p>
          <p className="mt-1 whitespace-pre-line">{purchase.notes}</p>
        </section>
      ) : null}
    </PrintDocument>
  );
}
