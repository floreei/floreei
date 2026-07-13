"use client";

import type { SalesChannel } from "@sistema-flores/types";
import { Boxes, ChevronRight, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Perguntou antes de abrir a venda: direta (varejo, balcão/entrega) ou atacado
 * (revenda em pacote fechado). Só aparece para quem tem os dois canais.
 */
export function SaleChannelChooser({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (channel: SalesChannel) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Nova venda</DialogTitle>
          <DialogDescription>Como é esta venda?</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <ChannelCard
            icon={ShoppingCart}
            title="Venda direta"
            hint="Balcão, buquê pronto ou entrega"
            onClick={() => onPick("RETAIL")}
          />
          <ChannelCard
            icon={Boxes}
            title="Atacado"
            hint="Revenda em pacote fechado"
            onClick={() => onPick("WHOLESALE")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  icon: typeof ShoppingCart;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
