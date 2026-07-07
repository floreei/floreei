"use client";

import type { CompanySettings } from "@sistema-flores/types";
import { ArrowLeft, Flower2, Printer } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PrintLetterhead } from "./print-letterhead";

/**
 * Casca de um documento imprimível (nota, extrato): barra de ações que some na
 * impressão, folha branca com faixa de destaque e rodapé. `print-color-adjust:
 * exact` garante que os tons suaves saiam no PDF/impressão (o navegador omite
 * fundos coloridos por padrão).
 */
export function PrintDocument({
  backHref,
  backLabel,
  footer,
  documentTitle,
  children,
}: {
  backHref: string;
  backLabel: string;
  footer: ReactNode;
  /**
   * Título da aba enquanto o documento está aberto — vira o NOME DO ARQUIVO
   * quando o navegador salva o PDF (ex.: "Maria Silva — Floreei — Orçamento 12").
   */
  documentTitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!documentTitle) return;
    const previous = document.title;
    document.title = documentTitle;
    return () => {
      document.title = previous;
    };
  }, [documentTitle]);

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none !important; box-shadow: none !important;
            border-radius: 0 !important;
          }
          #print-area, #print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div
        id="print-area"
        className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border bg-white text-[13px] leading-relaxed text-foreground shadow-[var(--shadow-card)]"
      >
        <div className="h-1.5 bg-primary" />
        <div className="px-10 py-9">
          {children}
          <footer className="mt-10 space-y-2 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
            <p>{footer}</p>
            {/* Gatilho de aquisição orgânica: quem recebe a nota conhece o Floreei. */}
            <p className="flex items-center justify-center gap-1.5">
              <Flower2 className="h-3 w-3 text-primary" aria-hidden />
              <span>
                Nota criada com{" "}
                <span className="font-semibold text-primary">Floreei</span> · o
                sistema para floriculturas
              </span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

/** Cabeçalho padrão do documento: timbrado à esquerda, título da peça à direita. */
export function PrintDocHeader({
  settings,
  company,
  title,
  subtitle,
}: {
  settings?: CompanySettings;
  company: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b-2 border-primary/15 pb-6">
      <PrintLetterhead settings={settings} company={company} />
      <div className="text-right">
        <p className="font-serif text-lg font-semibold text-primary">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {formatDate(new Date().toISOString())}
        </p>
      </div>
    </header>
  );
}

/** Classe do cabeçalho de tabela dos documentos — leve tom sage, texto da marca. */
export const printTheadClass =
  "bg-secondary/70 text-[11px] uppercase tracking-wide text-primary/80";
