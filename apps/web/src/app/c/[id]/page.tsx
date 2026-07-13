"use client";

import type { CompanySettings, ProductUnit, PublicCobranca } from "@sistema-flores/types";
import { Flower2, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PrintLetterhead } from "@/components/shared/print-letterhead";
import { PrintPix } from "@/components/shared/print-pix";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, apiFetch } from "@/lib/api/client";
import { unitLabels } from "@/lib/labels";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Status = "PAID" | "OVERDUE" | "OPEN";

function statusOf(c: PublicCobranca): Status {
  if (c.amountDue <= 0.005) return "PAID";
  const today = new Date().toISOString().slice(0, 10);
  if (c.dueDate && c.dueDate.slice(0, 10) < today) return "OVERDUE";
  return "OPEN";
}

const STATUS_LABEL: Record<Status, string> = {
  PAID: "Pago",
  OVERDUE: "Em atraso",
  OPEN: "Em aberto",
};

export default function PublicCobrancaPage() {
  const { id } = useParams<{ id: string }>();
  const [cobranca, setCobranca] = useState<PublicCobranca | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");

  useEffect(() => {
    let alive = true;
    apiFetch<PublicCobranca>(`/dunning/public/${id}`, { skipAuth: true })
      .then((data) => {
        if (!alive) return;
        setCobranca(data);
        setState("ready");
      })
      .catch((err) => {
        if (!alive) return;
        setState("invalid");
        if (!(err instanceof ApiError)) console.error(err);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (state === "loading") {
    return (
      <Shell>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </Shell>
    );
  }

  if (state === "invalid" || !cobranca) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Flower2 className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 font-serif text-xl font-semibold">
            Cobrança não encontrada
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O link pode ter expirado ou está incorreto. Peça um novo à
            floricultura.
          </p>
        </div>
      </Shell>
    );
  }

  const status = statusOf(cobranca);
  const paid = cobranca.receivedValue > 0.005;
  const settings: CompanySettings = {
    id: "",
    name: cobranca.company.name,
    document: cobranca.company.document,
    phone: cobranca.company.phone,
    email: cobranca.company.email,
    address: cobranca.company.address,
    pixKey: cobranca.pixKey,
    logo: cobranca.company.logo,
  };

  return (
    <Shell>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none !important; box-shadow: none !important; border-radius: 0 !important;
          }
          #print-area, #print-area * {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Salvar PDF
        </Button>
      </div>

      <div
        id="print-area"
        className="overflow-hidden rounded-2xl border border-border bg-white text-[13px] leading-relaxed text-foreground shadow-[var(--shadow-card)]"
      >
        <div className="h-1.5 bg-primary" />
        <div className="px-6 py-8 sm:px-10 sm:py-9">
          <header className="flex flex-col gap-4 border-b-2 border-primary/15 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <PrintLetterhead settings={settings} company={cobranca.company.name} />
            <div className="sm:text-right">
              <p className="font-serif text-lg font-semibold text-primary">
                Cobrança
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Referência nº {cobranca.reference}
              </p>
              <StatusBadge status={status} />
            </div>
          </header>

          {/* Destaque do valor e vencimento */}
          <section className="mt-6 flex flex-col gap-4 rounded-xl bg-secondary/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                {status === "PAID" ? "Valor pago" : "Valor a pagar"}
              </p>
              <p className="mt-1 font-serif text-3xl font-semibold tabular-nums text-primary">
                {formatCurrency(status === "PAID" ? cobranca.soldValue : cobranca.amountDue)}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                {cobranca.dueDate ? "Vencimento" : "Data da compra"}
              </p>
              <p className="mt-1 font-medium">
                {formatDate(cobranca.dueDate ?? cobranca.date)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cliente: {cobranca.customerName}
              </p>
            </div>
          </section>

          {/* Itens */}
          {cobranca.items.length > 0 ? (
            <table className="mt-6 w-full border-collapse">
              <thead>
                <tr className="bg-secondary/60 text-primary">
                  <th className="rounded-l-lg py-2.5 pl-3 text-left font-semibold">Item</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Qtd.</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Valor unit.</th>
                  <th className="rounded-r-lg py-2.5 pr-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {cobranca.items.map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2.5 pl-3">{item.description}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {item.quantity}{" "}
                      {(unitLabels[item.unit as ProductUnit] ?? "").toLowerCase()}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {formatCurrency(item.unitSalePrice)}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-6 rounded-lg border border-border/60 px-4 py-3">
              {cobranca.title}
            </p>
          )}

          {/* Totais */}
          <div className="mt-6 flex justify-end">
            <div className="w-full space-y-2 rounded-xl bg-secondary/50 px-5 py-4 sm:w-72">
              <div className="flex items-center justify-between border-b border-primary/15 pb-3">
                <span className="font-semibold">Total</span>
                <span className="font-serif text-xl font-semibold tabular-nums text-primary">
                  {formatCurrency(cobranca.soldValue)}
                </span>
              </div>
              {paid ? (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Pago</span>
                  <span className="tabular-nums text-success">
                    {formatCurrency(cobranca.receivedValue)}
                  </span>
                </div>
              ) : null}
              {cobranca.amountDue > 0.005 ? (
                <div className="flex items-center justify-between font-medium">
                  <span>A receber</span>
                  <span className="tabular-nums text-clay">
                    {formatCurrency(cobranca.amountDue)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Pagamento */}
          {cobranca.pixKey && cobranca.amountDue > 0.005 ? (
            <PrintPix
              pixKey={cobranca.pixKey}
              merchantName={cobranca.company.name}
              amount={cobranca.amountDue}
              txid={cobranca.reference}
            />
          ) : null}

          {cobranca.mpLink && cobranca.amountDue > 0.005 ? (
            <div className="no-print mt-6 flex justify-center">
              <a
                href={cobranca.mpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Pagar com Mercado Pago
              </a>
            </div>
          ) : null}

          {cobranca.notes ? (
            <section className="mt-8 border-t border-border pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                Observações
              </p>
              <p className="mt-1 whitespace-pre-line">{cobranca.notes}</p>
            </section>
          ) : null}

          <footer className="mt-10 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
            <Flower2 className="h-3 w-3 text-primary" aria-hidden />
            <span>
              Cobrança criada com{" "}
              <span className="font-semibold text-primary">Floreei</span> · o
              sistema para floriculturas
            </span>
          </footer>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "PAID" && "bg-success/10 text-success",
        status === "OVERDUE" && "bg-clay/10 text-clay",
        status === "OPEN" && "bg-primary/10 text-primary",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
