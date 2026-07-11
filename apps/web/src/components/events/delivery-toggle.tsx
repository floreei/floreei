"use client";

import type { EventStatus } from "@sistema-flores/types";
import { toast } from "sonner";
import { useSaveEvent } from "@/lib/api/events";
import { cn } from "@/lib/utils";

/**
 * Switch booleano de entrega para marcar "Entregue" (DONE) direto na tabela,
 * sem abrir o detalhe. Usa o mesmo caminho do botão "Marcar entregue" do
 * detalhe. Vendas canceladas não têm toggle.
 */
export function DeliveryToggle({
  id,
  status,
}: {
  id: string;
  status: EventStatus;
}) {
  const save = useSaveEvent(id);

  if (status === "CANCELED") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const delivered = status === "DONE";

  const toggle = () => {
    if (save.isPending) return;
    save.mutate(
      { status: delivered ? "CONFIRMED" : "DONE" },
      {
        onSuccess: () =>
          toast.success(delivered ? "Marcado como a entregar." : "Marcado como entregue."),
        onError: () => toast.error("Não foi possível atualizar a entrega."),
      },
    );
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={delivered}
      aria-label={delivered ? "Entregue" : "A entregar"}
      disabled={save.isPending}
      onClick={toggle}
      className="inline-flex items-center gap-2 disabled:opacity-60"
    >
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          delivered ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            delivered ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
      <span
        className={cn(
          "text-xs font-medium",
          delivered ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {delivered ? "Entregue" : "A entregar"}
      </span>
    </button>
  );
}
