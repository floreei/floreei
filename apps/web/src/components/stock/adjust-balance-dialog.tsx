"use client";

import type { StockLevel } from "@sistema-flores/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useAdjustStock } from "@/lib/api/stock";
import { unitLabels } from "@/lib/labels";

const round = (n: number) => Math.round(n * 1000) / 1000;

export function AdjustBalanceDialog({
  open,
  onOpenChange,
  level,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: StockLevel | null;
}) {
  const adjust = useAdjustStock();
  const [balance, setBalance] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && level) {
      setBalance(String(level.onHand));
      setNotes("");
    }
  }, [open, level]);

  if (!level) return null;

  const unit = unitLabels[level.unit].toLowerCase();
  const newBalance = Number(balance);
  const valid = balance.trim() !== "" && Number.isFinite(newBalance) && newBalance >= 0;
  const delta = valid ? round(newBalance - level.onHand) : 0;

  const submit = async () => {
    try {
      await adjust.mutateAsync({
        productId: level.productId,
        balance: newBalance,
        notes: notes.trim() || undefined,
      });
      toast.success("Saldo atualizado.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao ajustar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar saldo — {level.productName}</DialogTitle>
          <DialogDescription>
            Informe a quantidade real em estoque (contagem física). O sistema
            registra só a correção.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Saldo atual:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {level.onHand} {unit}
            </span>
          </p>
          <Field label={`Novo saldo (${unit})`} htmlFor="ab-balance">
            <Input
              id="ab-balance"
              type="number"
              step="0.001"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              autoFocus
              className="max-w-[200px]"
            />
          </Field>
          {valid && delta !== 0 ? (
            <p className="text-xs text-muted-foreground">
              {delta > 0
                ? `Entrada de ${delta} ${unit} (ajuste).`
                : `Saída de ${Math.abs(delta)} ${unit} (correção — não conta como perda).`}
            </p>
          ) : null}
          <Field label="Observação" htmlFor="ab-notes" optional>
            <Input
              id="ab-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: contagem física"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            loading={adjust.isPending}
            disabled={!valid || delta === 0}
          >
            Salvar saldo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
