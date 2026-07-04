"use client";

import { ArrowLeft, Flower2, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const company = settings?.name ?? user?.companyName ?? "Sistema Flores";
  const contactLine = [settings?.phone, settings?.email]
    .filter(Boolean)
    .join(" · ");

  if (isLoading || !quote) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 16mm; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between">
        <Link
          href={`/orcamentos/${quote.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao orçamento
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div
        id="print-area"
        className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-10 text-[13px] leading-relaxed text-foreground shadow-sm"
      >
        <header className="flex items-start justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            {settings?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo}
                alt={company}
                className="h-14 w-14 rounded-xl object-contain"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Flower2 className="h-6 w-6" />
              </span>
            )}
            <div className="space-y-0.5">
              <p className="font-serif text-xl font-semibold tracking-tight">
                {company}
              </p>
              {settings?.document ? (
                <p className="text-xs text-muted-foreground">
                  CNPJ/CPF: {settings.document}
                </p>
              ) : null}
              {settings?.address ? (
                <p className="text-xs text-muted-foreground">{settings.address}</p>
              ) : null}
              {contactLine ? (
                <p className="text-xs text-muted-foreground">{contactLine}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="font-serif text-lg font-semibold">Proposta</p>
            <p className="text-xs text-muted-foreground">
              Orçamento nº {quote.number}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 py-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Cliente
            </p>
            <p className="mt-1 font-medium">{quote.customer?.name ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Validade
            </p>
            <p className="mt-1 font-medium">
              {quote.validUntil ? formatDate(quote.validUntil) : "A combinar"}
            </p>
          </div>
        </section>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 text-left font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qtd.</th>
              <th className="py-2 text-right font-medium">Valor unit.</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {item.quantity} {unitLabels[item.unit].toLowerCase()}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatCurrency(item.salePrice)}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatCurrency(item.lineSale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex items-center justify-between border-t-2 border-foreground/80 pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-serif text-xl font-semibold tabular-nums">
                {formatCurrency(quote.totalSale)}
              </span>
            </div>
          </div>
        </div>

        {quote.notes ? (
          <section className="mt-8 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <p className="mt-1 whitespace-pre-line">{quote.notes}</p>
          </section>
        ) : null}

        <footer className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Proposta gerada por {company} · {formatDate(new Date().toISOString())}
        </footer>
      </div>
    </div>
  );
}
