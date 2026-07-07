"use client";

import { useParams } from "next/navigation";
import {
  PrintDocHeader,
  PrintDocument,
  printTheadClass,
} from "@/components/shared/print-document";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/lib/api/company";
import { useQuote } from "@/lib/api/quotes";
import { useAuth } from "@/lib/auth/auth-context";
import { unitLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function QuotePrintPage() {
  const params = useParams<{ id: string }>();
  const { data: quote, isLoading } = useQuote(params.id);
  const { data: settings } = useCompany();
  const { user } = useAuth();
  const company = settings?.name ?? user?.companyName ?? "Floreei";

  if (isLoading || !quote) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <PrintDocument
      backHref={`/orcamentos/${quote.id}`}
      backLabel="Voltar ao orçamento"
      documentTitle={`${quote.customer?.name ?? company} — Floreei — Orçamento ${quote.number}`}
      footer={
        <>
          Proposta gerada por {company} · {formatDate(new Date().toISOString())}
        </>
      }
    >
      <PrintDocHeader
        settings={settings}
        company={company}
        title="Proposta"
        subtitle={`Orçamento nº ${quote.number}`}
      />

      <section className="grid grid-cols-2 gap-4 py-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Cliente
          </p>
          <p className="mt-1 font-medium">{quote.customer?.name ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Validade
          </p>
          <p className="mt-1 font-medium">
            {quote.validUntil ? formatDate(quote.validUntil) : "A combinar"}
          </p>
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
          {quote.items.map((item) => (
            <tr key={item.id} className="border-b border-border/50">
              <td className="py-2.5 pl-3">{item.description}</td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                {item.quantity} {unitLabels[item.unit].toLowerCase()}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                {formatCurrency(item.salePrice)}
              </td>
              <td className="py-2.5 pr-3 text-right tabular-nums">
                {formatCurrency(item.lineSale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-72 rounded-xl bg-secondary/50 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-serif text-xl font-semibold tabular-nums text-primary">
              {formatCurrency(quote.totalSale)}
            </span>
          </div>
        </div>
      </div>

      {quote.notes ? (
        <section className="mt-8 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
            Observações
          </p>
          <p className="mt-1 whitespace-pre-line">{quote.notes}</p>
        </section>
      ) : null}
    </PrintDocument>
  );
}
