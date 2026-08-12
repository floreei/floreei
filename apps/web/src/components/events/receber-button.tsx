"use client";

import { HandCoins } from "lucide-react";
import { useState } from "react";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { Button } from "@/components/ui/button";

/**
 * Botão "Receber" da listagem: registra o recebimento (marca como paga) sem
 * abrir o detalhe da venda. Abre o mesmo diálogo do detalhe, já preenchido
 * com o saldo em aberto — confirmar quita a venda; dá para ajustar o valor
 * para um recebimento parcial.
 */
export function ReceberButton({
  eventId,
  balanceDue,
  className,
}: {
  eventId: string;
  balanceDue: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className ?? "h-8"}
        onClick={() => setOpen(true)}
      >
        <HandCoins className="h-4 w-4" />
        Receber
      </Button>
      <PaymentDialog
        open={open}
        onOpenChange={setOpen}
        mode="receive"
        targetId={eventId}
        balanceDue={balanceDue}
      />
    </>
  );
}
