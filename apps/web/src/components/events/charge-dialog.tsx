"use client";

import type { Event } from "@sistema-flores/types";
import { Copy, FileText, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/lib/api/company";
import { useCustomer } from "@/lib/api/customers";
import { useAuth } from "@/lib/auth/auth-context";
import { buildPixPayload } from "@/lib/pix";
import { formatCurrency, formatDate } from "@/lib/utils";
import { buildOrderMessage, whatsappHref } from "@/lib/whatsapp";

/**
 * Cobrança de um pedido pelo WhatsApp: monta o texto (resumo + valor em aberto
 * + Pix copia-e-cola, quando a empresa tem chave) editável antes de enviar, e
 * oferece a nota em PDF para anexar. O `wa.me` não anexa arquivos, então o
 * pagamento fica autônomo pelo Pix e a nota é um complemento opcional.
 */
export function ChargeDialog({
  event,
  open,
  onOpenChange,
}: {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: settings } = useCompany();
  const { data: customer } = useCustomer(event?.customerId ?? undefined);

  const company = settings?.name ?? user?.companyName ?? "Floreei";
  const balance = event ? Math.max(0, event.soldValue - event.receivedValue) : 0;

  const defaultMessage = useMemo(() => {
    if (!event) return "";
    const ref = event.id.slice(0, 8).toUpperCase();
    const pixLines =
      settings?.pixKey && balance > 0
        ? [
            "",
            "Pague com Pix (copie e cole no app do banco):",
            buildPixPayload({
              key: settings.pixKey,
              merchantName: company,
              amount: balance,
              txid: ref,
            }),
          ]
        : [];

    const order = buildOrderMessage({
      company,
      heading: `Cobrança do pedido ${ref}`,
      dateLabel: formatDate(event.date),
      items: event.items.map((i) => ({
        name: i.description,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
      total: event.soldValue,
      paid: event.receivedValue,
      balance,
      closing: "Qualquer dúvida, estou à disposição. Obrigado!",
    });

    // Insere o bloco do Pix antes da linha de fechamento.
    return pixLines.length > 0
      ? order.replace(
          "\nQualquer dúvida",
          `${pixLines.join("\n")}\n\nQualquer dúvida`,
        )
      : order;
  }, [event, settings?.pixKey, company, balance]);

  const [message, setMessage] = useState(defaultMessage);
  // Recarrega o texto quando o pedido/dados mudam (ou o dialog reabre).
  useEffect(() => {
    if (open) setMessage(defaultMessage);
  }, [open, defaultMessage]);

  if (!event) return null;

  const phone = customer?.whatsapp ?? customer?.phone ?? null;
  // Com telefone do cliente, prefixa o contato; sem, abre o WhatsApp para o
  // usuário escolher com quem falar.
  const waHref =
    whatsappHref(phone, message) ??
    `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Texto copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Realizar cobrança</DialogTitle>
          <DialogDescription>
            {balance > 0 ? (
              <>
                Em aberto:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(balance)}
                </span>{" "}
                · {customer?.name ?? "Consumidor"}
              </>
            ) : (
              <>Este pedido já está quitado.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            className="font-mono text-xs leading-relaxed"
            aria-label="Mensagem da cobrança"
          />
          {!settings?.pixKey ? (
            <p className="text-xs text-muted-foreground">
              Dica: cadastre sua chave Pix em{" "}
              <Link href="/empresa" className="text-primary hover:underline">
                Empresa
              </Link>{" "}
              para o código de pagamento entrar automaticamente na cobrança.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <a href={waHref} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
              Abrir no WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={copyText}>
            <Copy className="h-4 w-4" />
            Copiar texto
          </Button>
          <Button asChild variant="outline">
            <Link href={`/eventos/${event.id}/imprimir`} target="_blank">
              <FileText className="h-4 w-4" />
              Abrir nota
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O WhatsApp não anexa arquivos por link. Envie o texto (o Pix já
          permite o pagamento) e, se quiser mandar a nota, abra-a e compartilhe o
          PDF.
        </p>
      </DialogContent>
    </Dialog>
  );
}
