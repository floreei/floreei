"use client";

import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { useSendCobranca } from "@/lib/api/dunning";
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

  const cobrar = async (eventId: string) => {
    try {
      const { link, document: nota } = await send.mutateAsync(eventId);
      const text = buildCobrancaText({ saleDate: nota.date, link });
      // Copia antes de gerar o PDF: quanto mais perto do clique, mais navegadores aceitam.
      const copied = await copyText(text);
      const { renderCobrancaPdf } = await import("@/lib/cobranca-pdf");
      downloadBlob(await renderCobrancaPdf(nota), cobrancaFileName(nota));
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
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível montar a cobrança.",
      );
    }
  };

  return { cobrar, isPending: send.isPending };
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
