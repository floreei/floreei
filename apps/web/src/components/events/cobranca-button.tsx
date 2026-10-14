"use client";

import type { CobrancaDocument } from "@sistema-flores/types";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { fetchCobrancaDocuments, useSendCobranca } from "@/lib/api/dunning";
import { cobrancaFileName } from "@/lib/cobranca-files";
import { buildCobrancaText } from "@/lib/cobranca-message";
import { copyText, downloadBlob } from "@/lib/download";

/**
 * Ação "Cobrar": a API monta a cobrança (e marca a venda como cobrada); aqui
 * baixamos a nota em PDF e copiamos a mensagem curta com o link — o lojista
 * cola no WhatsApp do cliente e anexa o arquivo. Não abre o WhatsApp sozinho.
 */
export function useCobranca() {
  const send = useSendCobranca();
  // Cobre o fluxo inteiro (API + PDF), não só a mutation: evita clique duplo
  // baixar a nota duas vezes.
  const [busyId, setBusyId] = useState<string | null>(null);

  const cobrar = async (eventId: string) => {
    if (busyId) return;
    setBusyId(eventId);
    let nota: CobrancaDocument | null = null;
    try {
      const res = await send.mutateAsync(eventId);
      nota = res.document;
      const text = buildCobrancaText({ saleDate: nota.date, link: res.link });
      // Copia antes de gerar o PDF: quanto mais perto do clique, mais navegadores aceitam.
      const copied = await copyText(text);
      await baixarNota(nota);
      if (copied) {
        toast.success("Nota baixada e mensagem copiada.", {
          description: "Cole a mensagem no WhatsApp do cliente e anexe o PDF.",
        });
      } else {
        toast.success("Nota baixada.", {
          description: "Não deu para copiar a mensagem automaticamente.",
          action: { label: "Copiar mensagem", onClick: () => void copyText(text) },
        });
      }
    } catch (err) {
      if (nota) {
        // A API já marcou como cobrada; só o PDF falhou (chunk não carregou, logo
        // inválida…). Deixa claro e oferece gerar de novo sem repetir a marcação.
        const pendente = nota;
        toast.error("A venda foi marcada como cobrada, mas o PDF da nota falhou.", {
          action: { label: "Tentar de novo", onClick: () => void baixarDeNovo(pendente) },
        });
      } else {
        toast.error(
          err instanceof ApiError ? err.message : "Não foi possível montar a cobrança.",
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  return { cobrar, isPending: busyId !== null, busyId };
}

async function baixarNota(nota: CobrancaDocument): Promise<void> {
  const { renderCobrancaPdf } = await import("@/lib/cobranca-pdf");
  downloadBlob(await renderCobrancaPdf(nota), cobrancaFileName(nota));
}

/** Rebusca a nota (dados frescos, sem marcar de novo) e tenta gerar o PDF outra vez. */
async function baixarDeNovo(nota: CobrancaDocument): Promise<void> {
  try {
    const { documents } = await fetchCobrancaDocuments([nota.eventId]);
    await baixarNota(documents[0] ?? nota);
    toast.success("Nota baixada.");
  } catch {
    toast.error("O PDF falhou de novo. Abra a cobrança pelo link e salve em PDF por lá.", {
      action: { label: "Abrir", onClick: () => window.open(nota.link, "_blank") },
    });
  }
}

/** Botão avulso de cobrança (usado fora do menu de ações da linha). */
export function CobrancaButton({ eventId }: { eventId: string }) {
  const { cobrar, isPending } = useCobranca();

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8"
      onClick={() => cobrar(eventId)}
      loading={isPending}
    >
      <FileDown className="h-4 w-4" />
      Cobrar
    </Button>
  );
}
