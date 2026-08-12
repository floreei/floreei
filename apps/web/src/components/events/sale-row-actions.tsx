"use client";

import type { Event } from "@sistema-flores/types";
import { Eye, HandCoins, MessageCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCobranca } from "@/components/events/cobranca-button";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Menu de ações da linha da listagem (kebab): ver detalhes, receber e cobrar
 * num só botão, para a coluna não alargar a tabela.
 */
export function SaleRowActions({
  event,
  detailHref,
}: {
  event: Event;
  detailHref: string;
}) {
  const [payOpen, setPayOpen] = useState(false);
  const { cobrar } = useCobranca();
  const balanceDue = event.soldValue - event.receivedValue;
  const canCharge = event.status !== "CANCELED" && balanceDue > 0.005;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ações da venda">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={detailHref}>
              <Eye className="text-muted-foreground" />
              Ver detalhes
            </Link>
          </DropdownMenuItem>
          {canCharge ? (
            <>
              <DropdownMenuItem onClick={() => setPayOpen(true)}>
                <HandCoins className="text-muted-foreground" />
                Receber
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => cobrar(event.id)}>
                <MessageCircle className="text-muted-foreground" />
                Cobrar no WhatsApp
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {canCharge ? (
        <PaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          mode="receive"
          targetId={event.id}
          balanceDue={balanceDue}
        />
      ) : null}
    </>
  );
}
