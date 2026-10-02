"use client";

import type { Event } from "@sistema-flores/types";
import { toast } from "sonner";
import { useSaveEvent } from "@/lib/api/events";
import { cn } from "@/lib/utils";

/**
 * Switch booleano de cobrança para marcar "Cobrado" direto na tabela, no mesmo
 * molde do de entrega. "Cobrar no WhatsApp" e a régua automática já marcam
 * sozinhos; aqui o lojista marca cobranças feitas por fora ou desfaz. Vendas
 * canceladas ou quitadas não têm toggle (não há o que cobrar).
 */
export function ChargeToggle({
  event,
}: {
  event: Pick<Event, "id" | "status" | "soldValue" | "receivedValue" | "chargedAt">;
}) {
  const save = useSaveEvent(event.id);

  if (
    event.status === "CANCELED" ||
    event.soldValue - event.receivedValue <= 0.005
  ) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const charged = event.chargedAt !== null;

  const toggle = () => {
    if (save.isPending) return;
    save.mutate(
      { charged: !charged },
      {
        onSuccess: () =>
          toast.success(charged ? "Marcado como a cobrar." : "Marcado como cobrado."),
        onError: () => toast.error("Não foi possível atualizar a cobrança."),
      },
    );
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={charged}
      aria-label={charged ? "Cobrado" : "A cobrar"}
      title={
        event.chargedAt
          ? // Data local (o campo é um instante; cortar o ISO daria o dia em UTC).
            `Cobrado em ${new Date(event.chargedAt).toLocaleDateString("pt-BR")}`
          : undefined
      }
      disabled={save.isPending}
      onClick={toggle}
      className="inline-flex items-center gap-2 disabled:opacity-60"
    >
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          charged ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            charged ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          charged ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {charged ? "Cobrado" : "A cobrar"}
      </span>
    </button>
  );
}
