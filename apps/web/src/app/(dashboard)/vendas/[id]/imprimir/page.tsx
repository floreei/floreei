"use client";

import { useParams } from "next/navigation";
import {
  PrintDocHeader,
  PrintDocument,
  printTheadClass,
} from "@/components/shared/print-document";
import { PrintPix } from "@/components/shared/print-pix";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/lib/api/company";
import { useEvent } from "@/lib/api/events";
import { useAuth } from "@/lib/auth/auth-context";
import { unitLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrderNotePage() {
  const params = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(params.id);
  const { data: settings } = useCompany();
  const { user } = useAuth();
  const company = settings?.name ?? user?.companyName ?? "Floreei";

  if (isLoading || !event) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const pending = event.soldValue - event.receivedValue;
  const ref = event.id.slice(0, 8).toUpperCase();

  return (
    <PrintDocument
      backHref={`/vendas/${event.id}`}
      backLabel="Voltar à venda"
      documentTitle={`${event.customer?.name ?? "Consumidor"} — Floreei — Pedido ${ref}`}
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
        title="Nota do pedido"
        subtitle={`Pedido nº ${ref}`}
      />

      <section className="grid grid-cols-2 gap-4 py-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Cliente
          </p>
          <p className="mt-1 font-medium">{event.customer?.name ?? "Consumidor"}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Entrega
          </p>
          <p className="mt-1 font-medium">{formatDate(event.date)}</p>
          {event.location ? (
            <p className="text-xs text-muted-foreground">{event.location}</p>
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
          {event.items.length > 0 ? (
            event.items.map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-2.5 pl-3">{item.description}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {item.quantity} {unitLabels[item.unit].toLowerCase()}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {formatCurrency(item.unitSalePrice)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-border/50">
              <td className="py-2.5 pl-3" colSpan={4}>
                {event.title}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-72 space-y-2 rounded-xl bg-secondary/50 px-5 py-4">
          <div className="flex items-center justify-between border-b border-primary/15 pb-3">
            <span className="font-semibold">Total</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(event.soldValue)}
            </span>
          </div>
          {event.receivedValue > 0 ? (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Pago</span>
              <span className="tabular-nums text-success">
                {formatCurrency(event.receivedValue)}
              </span>
            </div>
          ) : null}
          {pending > 0 ? (
            <div className="flex items-center justify-between font-medium">
              <span>A receber</span>
              <span className="tabular-nums text-clay">{formatCurrency(pending)}</span>
            </div>
          ) : null}
        </div>
      </div>

      {settings?.pixKey && pending > 0 ? (
        <PrintPix
          pixKey={settings.pixKey}
          merchantName={company}
          amount={pending}
          txid={ref}
        />
      ) : null}

      {event.notes ? (
        <section className="mt-8 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Observações
          </p>
          <p className="mt-1 whitespace-pre-line">{event.notes}</p>
        </section>
      ) : null}

    </PrintDocument>
  );
}
