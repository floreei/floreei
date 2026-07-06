"use client";

import type { Expense, PaymentMethod } from "@sistema-flores/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { FileUpload, type UploadedFile } from "@/components/shared/file-upload";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { usePayExpense } from "@/lib/api/expenses";
import { formatCurrency } from "@/lib/utils";

const methods: Array<[PaymentMethod, string]> = [
  ["PIX", "Pix"],
  ["CASH", "Dinheiro"],
  ["CARD", "Cartão"],
  ["TRANSFER", "Transferência"],
  ["BOLETO", "Boleto"],
  ["OTHER", "Outro"],
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MarkPaidDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}) {
  const pay = usePayExpense();
  const [paidDate, setPaidDate] = useState(todayStr());
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [receipt, setReceipt] = useState<UploadedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPaidDate(todayStr());
      setMethod("PIX");
      setReceipt(null);
    }
  }, [open]);

  const submit = async () => {
    if (!expense) return;
    setSubmitting(true);
    try {
      await pay.mutateAsync({
        id: expense.id,
        input: {
          paidDate,
          paymentMethod: method,
          receipt: receipt
            ? {
                label: receipt.label,
                url: receipt.url,
                contentType: receipt.contentType,
              }
            : undefined,
        },
      });
      toast.success("Despesa marcada como paga.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Erro ao marcar como pago.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como pago</DialogTitle>
          <DialogDescription>
            {expense
              ? `${expense.description} · ${formatCurrency(expense.amount)}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data do pagamento" htmlFor="mp-date" required>
              <Input
                id="mp-date"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </Field>
            <Field label="Método" required>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map(([value, labelText]) => (
                    <SelectItem key={value} value={value}>
                      {labelText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Comprovante de pagamento" optional hint="Imagem ou PDF.">
            <FileUpload scope="expenses" value={receipt} onChange={setReceipt} />
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={submitting}>
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
