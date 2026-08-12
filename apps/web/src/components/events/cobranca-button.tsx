"use client";

import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { useSendCobranca } from "@/lib/api/dunning";
import { whatsappHref } from "@/lib/whatsapp";

/**
 * Ação "Cobrar": monta a cobrança da venda no backend (texto + PIX/link
 * conforme a régua) e abre o WhatsApp do dono com a mensagem pronta. Uso
 * manual, complementar à régua automática.
 */
export function useCobranca() {
  const send = useSendCobranca();

  const cobrar = async (eventId: string) => {
    try {
      const { phone, message, link } = await send.mutateAsync(eventId);
      const href = whatsappHref(phone, message);
      if (!href) {
        // Sem WhatsApp: cai no link da cobrança para o dono enviar como quiser.
        await navigator.clipboard?.writeText(link).catch(() => undefined);
        toast.info("Cliente sem WhatsApp — link da cobrança copiado.", {
          action: { label: "Abrir", onClick: () => window.open(link, "_blank") },
        });
        return;
      }
      window.open(href, "_blank", "noopener,noreferrer");
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
      <MessageCircle className="h-4 w-4" />
      Cobrar
    </Button>
  );
}
